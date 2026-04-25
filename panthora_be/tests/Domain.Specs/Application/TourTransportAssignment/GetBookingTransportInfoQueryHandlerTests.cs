using global::Application.Features.TourTransportAssignment.DTOs;
using global::Application.Features.TourTransportAssignment.Queries;
using global::Domain.Common.Repositories;
using global::Domain.Entities;
using global::Domain.Enums;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.TourTransportAssignment;

public sealed class GetBookingTransportInfoQueryHandlerTests
{
    private readonly ITourDayActivityRouteTransportRepository _routeTransportRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly IBookingTourGuideRepository _bookingTourGuideRepository;
    private readonly GetBookingTransportInfoQueryHandler _handler;

    public GetBookingTransportInfoQueryHandlerTests()
    {
        _routeTransportRepository = Substitute.For<ITourDayActivityRouteTransportRepository>();
        _bookingRepository = Substitute.For<IBookingRepository>();
        _bookingTourGuideRepository = Substitute.For<IBookingTourGuideRepository>();
        _handler = new GetBookingTransportInfoQueryHandler(
            _routeTransportRepository, _bookingRepository, _bookingTourGuideRepository);
    }

    private static (GetBookingTransportInfoQuery Query, Guid CurrentUserId) Query(
        Guid currentUserId = default,
        Guid bookingId = default)
    {
        var userId = currentUserId == default ? Guid.NewGuid() : currentUserId;
        var bId = bookingId == default ? Guid.NewGuid() : bookingId;
        return (new GetBookingTransportInfoQuery(userId, bId), userId);
    }

    #region TC01: Booking not found

    [Fact]
    public async Task Handle_BookingNotFound_ReturnsNotFound()
    {
        var bookingId = Guid.NewGuid();
        _bookingRepository.GetByIdAsync(bookingId).Returns((BookingEntity?)null);

        var (query, _) = Query(bookingId: bookingId);

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal("Booking.NotFound", result.FirstError.Code);
    }

    #endregion

    #region TC02: No transport assignments

    [Fact]
    public async Task Handle_NoAssignments_ReturnsEmptyRoutes()
    {
        var (query, userId) = Query();
        var bookingId = query.BookingId;
        _bookingRepository.GetByIdAsync(bookingId)
            .Returns(new BookingEntity { Id = bookingId, UserId = userId });
        _routeTransportRepository.FindByBookingIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<TourDayActivityRouteTransportEntity>());

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(bookingId, result.Value.BookingId);
        Assert.Empty(result.Value.Routes);
    }

    #endregion

    #region TC03: Assignment with driver and vehicle

    [Fact]
    public async Task Handle_WithDriverAndVehicle_ReturnsCorrectData()
    {
        var (query, userId) = Query();
        var bookingId = query.BookingId;
        var routeId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();

        var routeEntity = new TourDayActivityEntity { Id = routeId, Order = 1 };
        var driver = new DriverEntity
        {
            Id = driverId,
            FullName = "Nguyen Van A",
            PhoneNumber = "0912345678",
            LicenseNumber = "0123456789"
        };
        var vehicle = new VehicleEntity
        {
            Id = vehicleId,
            VehiclePlate = "30A-12345",
            VehicleType = VehicleType.Bus,
            Brand = "Toyota",
            Model = "Coaster",
            SeatCapacity = 45
        };
        var bookingActivity = new BookingActivityReservationEntity
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            Booking = new BookingEntity { Id = bookingId, UserId = userId },
            StartTime = DateTimeOffset.UtcNow
        };

        var routeTransport = new TourDayActivityRouteTransportEntity
        {
            BookingActivityReservationId = bookingActivity.Id,
            BookingActivityReservation = bookingActivity,
            TourDayActivityId = routeId,
            TourDayActivity = routeEntity,
            DriverId = driverId,
            Driver = driver,
            VehicleId = vehicleId,
            Vehicle = vehicle
        };

        _bookingRepository.GetByIdAsync(bookingId)
            .Returns(new BookingEntity { Id = bookingId, UserId = userId });
        _routeTransportRepository.FindByBookingIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<TourDayActivityRouteTransportEntity> { routeTransport });

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Routes);
        var route = result.Value.Routes[0];
        Assert.Equal(routeId, route.TourDayActivityId);
        Assert.Equal(1, route.RouteOrder);

        Assert.NotNull(route.Driver);
        Assert.Equal("Nguyen Van A", route.Driver.FullName);
        Assert.Equal("0912345678", route.Driver.PhoneNumber);
        // License masked — last 4 chars visible
        Assert.Equal("******6789", route.Driver.MaskedLicenseNumber);

        Assert.NotNull(route.Vehicle);
        Assert.Equal("30A-12345", route.Vehicle.VehiclePlate);
        Assert.Equal("Bus", route.Vehicle.VehicleType);
        Assert.Equal("Toyota", route.Vehicle.Brand);
        Assert.Equal("Coaster", route.Vehicle.Model);
        Assert.Equal(45, route.Vehicle.SeatCapacity);
    }

    #endregion

    #region TC04: Multiple assignments — multiple routes

    [Fact]
    public async Task Handle_MultipleAssignments_ReturnsAllRoutes()
    {
        var (query, userId) = Query();
        var bookingId = query.BookingId;

        var route1 = new TourDayActivityEntity { Id = Guid.NewGuid(), Order = 1 };
        var route2 = new TourDayActivityEntity { Id = Guid.NewGuid(), Order = 2 };
        var route3 = new TourDayActivityEntity { Id = Guid.NewGuid(), Order = 3 };

        var rt1 = new TourDayActivityRouteTransportEntity
        {
            BookingActivityReservationId = Guid.NewGuid(),
            TourDayActivityId = route1.Id,
            DriverId = Guid.NewGuid(),
            VehicleId = Guid.NewGuid(),
            TourDayActivity = route1,
            Driver = new DriverEntity { Id = Guid.NewGuid(), FullName = "Driver 1", LicenseNumber = "AAA1111111", LicenseType = DriverLicenseType.B2, PhoneNumber = "0911111111" },
            Vehicle = new VehicleEntity { Id = Guid.NewGuid(), VehiclePlate = "30A-11111", VehicleType = VehicleType.Car, SeatCapacity = 4 }
        };
        var rt2 = new TourDayActivityRouteTransportEntity
        {
            BookingActivityReservationId = Guid.NewGuid(),
            TourDayActivityId = route2.Id,
            DriverId = null,
            VehicleId = null,
            TourDayActivity = route2
        };
        var rt3 = new TourDayActivityRouteTransportEntity
        {
            BookingActivityReservationId = Guid.NewGuid(),
            TourDayActivityId = route3.Id,
            DriverId = Guid.NewGuid(),
            VehicleId = Guid.NewGuid(),
            TourDayActivity = route3,
            Driver = new DriverEntity { Id = Guid.NewGuid(), FullName = "Driver 3", LicenseNumber = "CCC3333333", LicenseType = DriverLicenseType.D, PhoneNumber = "0933333333" },
            Vehicle = new VehicleEntity { Id = Guid.NewGuid(), VehiclePlate = "30C-33333", VehicleType = VehicleType.Minibus, SeatCapacity = 15 }
        };

        _bookingRepository.GetByIdAsync(bookingId)
            .Returns(new BookingEntity { Id = bookingId, UserId = userId });
        _routeTransportRepository.FindByBookingIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<TourDayActivityRouteTransportEntity> { rt1, rt2, rt3 });

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(3, result.Value.Routes.Count);
        Assert.Equal(route1.Id, result.Value.Routes[0].TourDayActivityId);
        Assert.NotNull(result.Value.Routes[0].Driver);
        Assert.Null(result.Value.Routes[1].Driver);
        Assert.Null(result.Value.Routes[1].Vehicle);
        Assert.NotNull(result.Value.Routes[2].Driver);
        Assert.NotNull(result.Value.Routes[2].Vehicle);
    }

    #endregion

    #region TC05: Driver only — vehicle null

    [Fact]
    public async Task Handle_DriverOnly_VehicleNull()
    {
        var (query, userId) = Query();
        var bookingId = query.BookingId;
        var routeId = Guid.NewGuid();

        var route = new TourDayActivityEntity { Id = routeId, Order = 1 };
        var driver = new DriverEntity
        {
            Id = Guid.NewGuid(),
            FullName = "Driver Only",
            PhoneNumber = "0909000000",
            LicenseNumber = "L99998888"
        };

        var routeTransport = new TourDayActivityRouteTransportEntity
        {
            BookingActivityReservationId = Guid.NewGuid(),
            TourDayActivityId = routeId,
            DriverId = driver.Id,
            VehicleId = null,
            TourDayActivity = route,
            Driver = driver
        };

        _bookingRepository.GetByIdAsync(bookingId)
            .Returns(new BookingEntity { Id = bookingId, UserId = userId });
        _routeTransportRepository.FindByBookingIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<TourDayActivityRouteTransportEntity> { routeTransport });

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Routes);
        Assert.NotNull(result.Value.Routes[0].Driver);
        Assert.Null(result.Value.Routes[0].Vehicle);
        Assert.Equal("Driver Only", result.Value.Routes[0].Driver!.FullName);
    }

    #endregion

    #region TC06: Vehicle only — driver null

    [Fact]
    public async Task Handle_VehicleOnly_DriverNull()
    {
        var (query, userId) = Query();
        var bookingId = query.BookingId;
        var routeId = Guid.NewGuid();

        var route = new TourDayActivityEntity { Id = routeId, Order = 1 };
        var vehicle = new VehicleEntity
        {
            Id = Guid.NewGuid(),
            VehiclePlate = "99Z-99999",
            VehicleType = VehicleType.Coach,
            Brand = "Hyundai",
            Model = "Universe",
            SeatCapacity = 50
        };

        var routeTransport = new TourDayActivityRouteTransportEntity
        {
            BookingActivityReservationId = Guid.NewGuid(),
            TourDayActivityId = routeId,
            DriverId = null,
            VehicleId = vehicle.Id,
            TourDayActivity = route,
            Vehicle = vehicle
        };

        _bookingRepository.GetByIdAsync(bookingId)
            .Returns(new BookingEntity { Id = bookingId, UserId = userId });
        _routeTransportRepository.FindByBookingIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<TourDayActivityRouteTransportEntity> { routeTransport });

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Single(result.Value.Routes);
        Assert.Null(result.Value.Routes[0].Driver);
        Assert.NotNull(result.Value.Routes[0].Vehicle);
        Assert.Equal("99Z-99999", result.Value.Routes[0].Vehicle!.VehiclePlate);
    }

    #endregion

    #region TC07: License number masking — various lengths

    [Theory]
    [InlineData("1234", "1234")]
    [InlineData("1A234", "*A234")]
    [InlineData("ABCDEF", "**CDEF")]
    [InlineData("AB123456", "****3456")]
    public async Task Handle_LicenseMasking_ShowsLast4Chars(string license, string expected)
    {
        var (query, userId) = Query();
        var bookingId = query.BookingId;
        var routeId = Guid.NewGuid();

        var driver = new DriverEntity
        {
            Id = Guid.NewGuid(),
            FullName = "Test Driver",
            PhoneNumber = "0912345678",
            LicenseNumber = license
        };
        var routeTransport = new TourDayActivityRouteTransportEntity
        {
            BookingActivityReservationId = Guid.NewGuid(),
            TourDayActivityId = routeId,
            DriverId = driver.Id,
            TourDayActivity = new TourDayActivityEntity { Id = routeId, Order = 1 },
            Driver = driver
        };

        _bookingRepository.GetByIdAsync(bookingId)
            .Returns(new BookingEntity { Id = bookingId, UserId = userId });
        _routeTransportRepository.FindByBookingIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<TourDayActivityRouteTransportEntity> { routeTransport });

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(expected, result.Value.Routes[0].Driver!.MaskedLicenseNumber);
    }

    [Fact]
    public async Task Handle_LicenseTooShort_ShowsAsterisks()
    {
        var (query, userId) = Query();
        var bookingId = query.BookingId;
        var routeId = Guid.NewGuid();

        var driver = new DriverEntity
        {
            Id = Guid.NewGuid(),
            FullName = "Short License",
            PhoneNumber = "0912345678",
            LicenseNumber = "123"
        };
        var routeTransport = new TourDayActivityRouteTransportEntity
        {
            BookingActivityReservationId = Guid.NewGuid(),
            TourDayActivityId = routeId,
            DriverId = driver.Id,
            TourDayActivity = new TourDayActivityEntity { Id = routeId, Order = 1 },
            Driver = driver
        };

        _bookingRepository.GetByIdAsync(bookingId)
            .Returns(new BookingEntity { Id = bookingId, UserId = userId });
        _routeTransportRepository.FindByBookingIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<TourDayActivityRouteTransportEntity> { routeTransport });

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal("****", result.Value.Routes[0].Driver!.MaskedLicenseNumber);
    }

    #endregion

    #region TC08: Route with no order — defaults to 0

    [Fact]
    public async Task Handle_RouteNullOrder_DefaultsToZero()
    {
        var (query, userId) = Query();
        var bookingId = query.BookingId;
        var routeId = Guid.NewGuid();

        var route = new TourDayActivityEntity { Id = routeId, Order = 0 };
        var routeTransport = new TourDayActivityRouteTransportEntity
        {
            BookingActivityReservationId = Guid.NewGuid(),
            TourDayActivityId = routeId,
            TourDayActivity = route
        };

        _bookingRepository.GetByIdAsync(bookingId)
            .Returns(new BookingEntity { Id = bookingId, UserId = userId });
        _routeTransportRepository.FindByBookingIdAsync(bookingId, Arg.Any<CancellationToken>())
            .Returns(new List<TourDayActivityRouteTransportEntity> { routeTransport });

        var result = await _handler.Handle(query, CancellationToken.None);

        Assert.False(result.IsError);
        Assert.Equal(0, result.Value.Routes[0].RouteOrder);
    }

    #endregion
}
