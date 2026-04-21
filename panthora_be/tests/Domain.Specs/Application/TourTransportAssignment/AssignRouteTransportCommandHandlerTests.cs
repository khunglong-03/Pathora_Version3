using Application.Features.TourTransportAssignment.Commands;
using Application.Features.TourTransportAssignment.DTOs;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.TourTransportAssignment;

public sealed class AssignRouteTransportCommandHandlerTests
{
    private readonly ITourDayActivityRouteTransportRepository _routeTransportRepository;
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IDriverRepository _driverRepository;
    private readonly AssignRouteTransportCommandHandler _handler;

    public AssignRouteTransportCommandHandlerTests()
    {
        _routeTransportRepository = Substitute.For<ITourDayActivityRouteTransportRepository>();
        _vehicleRepository = Substitute.For<IVehicleRepository>();
        _driverRepository = Substitute.For<IDriverRepository>();
        _handler = new AssignRouteTransportCommandHandler(
            _routeTransportRepository, _vehicleRepository, _driverRepository);
    }

    private static AssignRouteTransportCommand ValidCommand(
        Guid currentUserId,
        Guid bookingId,
        Guid routeId,
        Guid? driverId = null,
        Guid? vehicleId = null)
    {
        return new AssignRouteTransportCommand(
            currentUserId,
            new RouteTransportAssignmentRequestDto(bookingId, routeId, driverId, vehicleId));
    }

    #region TC01: Valid assignment with driver and vehicle — same owner, continent match

    [Fact]
    public async Task Handle_DriverAndVehicleSameOwnerContinentMatch_Success()
    {
        var currentUserId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var routeId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();

        _vehicleRepository.GetByIdAsync(vehicleId)
            .Returns(new VehicleEntity
            {
                Id = vehicleId,
                OwnerId = ownerId,
                VehiclePlate = "30A-12345",
                VehicleType = VehicleType.Car,
                SeatCapacity = 5,
                LocationArea = Continent.Asia
            });
        _driverRepository.FindByIdAsync(driverId, Arg.Any<CancellationToken>())
            .Returns(new DriverEntity
            {
                Id = driverId,
                UserId = ownerId,
                FullName = "Driver A",
                LicenseNumber = "L001",
                LicenseType = DriverLicenseType.B2,
                PhoneNumber = "0912345678"
            });
        _routeTransportRepository.GetTourContinentByActivityIdAsync(routeId, Arg.Any<CancellationToken>())
            .Returns(Continent.Asia);

        var command = ValidCommand(currentUserId, bookingId, routeId, driverId, vehicleId);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _routeTransportRepository.Received().UpsertAsync(
            Arg.Is<TourDayActivityRouteTransportEntity>(e =>
                e.BookingActivityReservationId == bookingId &&
                e.TourDayActivityId == routeId &&
                e.DriverId == driverId &&
                e.VehicleId == vehicleId),
            Arg.Any<CancellationToken>());
    }

    #endregion

    #region TC02: Owner mismatch — different TransportProvider

    [Fact]
    public async Task Handle_DriverAndVehicleDifferentOwner_ReturnsValidationError()
    {
        var currentUserId = Guid.NewGuid();
        var driverOwnerId = Guid.NewGuid();
        var vehicleOwnerId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var routeId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();

        _vehicleRepository.GetByIdAsync(vehicleId)
            .Returns(new VehicleEntity
            {
                Id = vehicleId,
                OwnerId = vehicleOwnerId,
                VehiclePlate = "30A-99999",
                VehicleType = VehicleType.Bus,
                SeatCapacity = 40
            });
        _driverRepository.FindByIdAsync(driverId, Arg.Any<CancellationToken>())
            .Returns(new DriverEntity
            {
                Id = driverId,
                UserId = driverOwnerId,
                FullName = "Driver B",
                LicenseNumber = "L002",
                LicenseType = DriverLicenseType.E,
                PhoneNumber = "0987654321"
            });

        var command = ValidCommand(currentUserId, bookingId, routeId, driverId, vehicleId);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal("Transport.OwnerMismatch", result.FirstError.Code);
        await _routeTransportRepository.Received(0).UpsertAsync(
            Arg.Any<TourDayActivityRouteTransportEntity>(), Arg.Any<CancellationToken>());
    }

    #endregion

    #region TC03: Continent mismatch

    [Fact]
    public async Task Handle_VehicleContinentDoesNotMatchTour_ReturnsValidationError()
    {
        var currentUserId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var routeId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();

        _vehicleRepository.GetByIdAsync(vehicleId)
            .Returns(new VehicleEntity
            {
                Id = vehicleId,
                OwnerId = ownerId,
                VehiclePlate = "30A-EUR01",
                VehicleType = VehicleType.Coach,
                SeatCapacity = 50,
                LocationArea = Continent.Europe
            });
        _routeTransportRepository.GetTourContinentByActivityIdAsync(routeId, Arg.Any<CancellationToken>())
            .Returns(Continent.Asia);

        var command = ValidCommand(currentUserId, bookingId, routeId, vehicleId: vehicleId);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.True(result.IsError);
        Assert.Equal("Transport.ContinentMismatch", result.FirstError.Code);
        await _routeTransportRepository.Received(0).UpsertAsync(
            Arg.Any<TourDayActivityRouteTransportEntity>(), Arg.Any<CancellationToken>());
    }

    #endregion

    #region TC04: Vehicle only — no driver

    [Fact]
    public async Task Handle_VehicleOnly_Success()
    {
        var currentUserId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var routeId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();

        _vehicleRepository.GetByIdAsync(vehicleId)
            .Returns(new VehicleEntity
            {
                Id = vehicleId,
                OwnerId = ownerId,
                VehiclePlate = "30A-11111",
                VehicleType = VehicleType.Minibus,
                SeatCapacity = 15,
                LocationArea = Continent.Asia
            });
        _routeTransportRepository.GetTourContinentByActivityIdAsync(routeId, Arg.Any<CancellationToken>())
            .Returns(Continent.Asia);

        var command = ValidCommand(currentUserId, bookingId, routeId, vehicleId: vehicleId);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _routeTransportRepository.Received().UpsertAsync(
            Arg.Is<TourDayActivityRouteTransportEntity>(e =>
                e.BookingActivityReservationId == bookingId &&
                e.TourDayActivityId == routeId &&
                e.VehicleId == vehicleId &&
                e.DriverId == null),
            Arg.Any<CancellationToken>());
    }

    #endregion

    #region TC05: Driver only — no vehicle

    [Fact]
    public async Task Handle_DriverOnly_Success()
    {
        var currentUserId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var routeId = Guid.NewGuid();
        var driverId = Guid.NewGuid();

        _driverRepository.FindByIdAsync(driverId, Arg.Any<CancellationToken>())
            .Returns(new DriverEntity
            {
                Id = driverId,
                UserId = ownerId,
                FullName = "Driver C",
                LicenseNumber = "L003",
                LicenseType = DriverLicenseType.D,
                PhoneNumber = "0977123456"
            });

        var command = ValidCommand(currentUserId, bookingId, routeId, driverId);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _routeTransportRepository.Received().UpsertAsync(
            Arg.Is<TourDayActivityRouteTransportEntity>(e =>
                e.BookingActivityReservationId == bookingId &&
                e.TourDayActivityId == routeId &&
                e.DriverId == driverId &&
                e.VehicleId == null),
            Arg.Any<CancellationToken>());
    }

    #endregion

    #region TC06: No driver, no vehicle — valid

    [Fact]
    public async Task Handle_NoDriverNoVehicle_Success()
    {
        var currentUserId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var routeId = Guid.NewGuid();

        var command = ValidCommand(currentUserId, bookingId, routeId);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
        await _routeTransportRepository.Received().UpsertAsync(
            Arg.Is<TourDayActivityRouteTransportEntity>(e =>
                e.BookingActivityReservationId == bookingId &&
                e.TourDayActivityId == routeId &&
                e.DriverId == null &&
                e.VehicleId == null),
            Arg.Any<CancellationToken>());
    }

    #endregion

    #region TC07: Vehicle with no LocationArea — passes

    [Fact]
    public async Task Handle_VehicleNoLocationArea_Success()
    {
        var currentUserId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var routeId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();

        _vehicleRepository.GetByIdAsync(vehicleId)
            .Returns(new VehicleEntity
            {
                Id = vehicleId,
                OwnerId = ownerId,
                VehiclePlate = "30A-NOAREA",
                VehicleType = VehicleType.Van,
                SeatCapacity = 8,
                LocationArea = null
            });
        _routeTransportRepository.GetTourContinentByActivityIdAsync(routeId, Arg.Any<CancellationToken>())
            .Returns(Continent.Asia);

        var command = ValidCommand(currentUserId, bookingId, routeId, vehicleId: vehicleId);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
    }

    #endregion

    #region TC08: Continent check skipped when tour has no continent

    [Fact]
    public async Task Handle_TourHasNoContinent_Success()
    {
        var currentUserId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var routeId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();

        _vehicleRepository.GetByIdAsync(vehicleId)
            .Returns(new VehicleEntity
            {
                Id = vehicleId,
                OwnerId = ownerId,
                VehiclePlate = "30A-NOCONT",
                VehicleType = VehicleType.Car,
                SeatCapacity = 5,
                LocationArea = Continent.Americas
            });
        _routeTransportRepository.GetTourContinentByActivityIdAsync(routeId, Arg.Any<CancellationToken>())
            .Returns((Continent?)null);

        var command = ValidCommand(currentUserId, bookingId, routeId, vehicleId: vehicleId);

        var result = await _handler.Handle(command, CancellationToken.None);

        Assert.False(result.IsError);
    }

    #endregion

    #region TC09: Driver not found — no owner check performed

    [Fact]
    public async Task Handle_DriverNotFound_NoOwnerCheck()
    {
        var currentUserId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var routeId = Guid.NewGuid();

        _vehicleRepository.GetByIdAsync(vehicleId)
            .Returns(new VehicleEntity
            {
                Id = vehicleId,
                OwnerId = Guid.NewGuid(),
                VehiclePlate = "30A-00000",
                VehicleType = VehicleType.Car,
                SeatCapacity = 5
            });
        _driverRepository.FindByIdAsync(driverId, Arg.Any<CancellationToken>())
            .Returns((DriverEntity?)null);

        var command = ValidCommand(currentUserId, bookingId, routeId, driverId, vehicleId);

        var result = await _handler.Handle(command, CancellationToken.None);

        // Driver null → no owner check → success (Upsert proceeds)
        Assert.False(result.IsError);
    }

    #endregion
}
