using Application.Features.TourTransportAssignment.DTOs;
using Application.Features.TourTransportAssignment.Validators;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using FluentValidation.TestHelper;
using NSubstitute;
using Xunit;

namespace Domain.Specs.Application.Validators;

public sealed class RouteTransportAssignmentRequestDtoValidatorTests
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IDriverRepository _driverRepository;
    private readonly ITourDayActivityRouteTransportRepository _routeTransportRepository;
    private readonly RouteTransportAssignmentRequestDtoValidator _validator;

    public RouteTransportAssignmentRequestDtoValidatorTests()
    {
        _vehicleRepository = Substitute.For<IVehicleRepository>();
        _driverRepository = Substitute.For<IDriverRepository>();
        _routeTransportRepository = Substitute.For<ITourDayActivityRouteTransportRepository>();
        _validator = new RouteTransportAssignmentRequestDtoValidator(
            _vehicleRepository, _driverRepository, _routeTransportRepository);
    }

    private static RouteTransportAssignmentRequestDto ValidDto() => new(
        BookingActivityReservationId: Guid.NewGuid(),
        TourPlanRouteId: Guid.NewGuid(),
        DriverId: null,
        VehicleId: null);

    #region Required Fields

    [Fact]
    public void Validate_AllFieldsNull_Fails()
    {
        var dto = new RouteTransportAssignmentRequestDto(
            BookingActivityReservationId: Guid.Empty,
            TourPlanRouteId: Guid.Empty,
            DriverId: null,
            VehicleId: null);
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.BookingActivityReservationId);
        result.ShouldHaveValidationErrorFor(x => x.TourPlanRouteId);
    }

    [Fact]
    public void Validate_ValidDto_Passes()
    {
        var dto = ValidDto();
        var result = _validator.TestValidate(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_EmptyBookingActivityReservationId_Fails()
    {
        var dto = ValidDto() with { BookingActivityReservationId = Guid.Empty };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.BookingActivityReservationId)
            .WithErrorMessage("Booking activity reservation ID is required.");
    }

    [Fact]
    public void Validate_EmptyTourPlanRouteId_Fails()
    {
        var dto = ValidDto() with { TourPlanRouteId = Guid.Empty };
        var result = _validator.TestValidate(dto);
        result.ShouldHaveValidationErrorFor(x => x.TourPlanRouteId)
            .WithErrorMessage("Tour plan route ID is required.");
    }

    #endregion

    #region DriverId and VehicleId both null — no owner/continent check

    [Fact]
    public async Task Validate_DriverIdNullVehicleIdNull_NoOwnerCheck()
    {
        var dto = ValidDto();
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldNotHaveAnyValidationErrors();
        await _driverRepository.Received(0).FindByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
        await _vehicleRepository.Received(0).GetByIdAsync(Arg.Any<Guid>());
    }

    #endregion

    #region Owner Matching (same TransportProvider)

    [Fact]
    public async Task Validate_DriverAndVehicleSameOwner_Passes()
    {
        var driverId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();

        _driverRepository.FindByIdAsync(driverId, Arg.Any<CancellationToken>())
            .Returns(new DriverEntity { Id = driverId, UserId = ownerId, FullName = "Driver A", LicenseNumber = "L001", LicenseType = DriverLicenseType.B2, PhoneNumber = "0912345678" });
        _vehicleRepository.GetByIdAsync(vehicleId)
            .Returns(new VehicleEntity { Id = vehicleId, OwnerId = ownerId, VehiclePlate = "30A-12345", VehicleType = VehicleType.Car, SeatCapacity = 5 });

        var dto = ValidDto() with { DriverId = driverId, VehicleId = vehicleId };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldNotHaveValidationErrorFor("Driver & Vehicle Owner");
    }

    [Fact]
    public async Task Validate_DriverAndVehicleDifferentOwner_Fails()
    {
        var driverId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var driverOwnerId = Guid.NewGuid();
        var vehicleOwnerId = Guid.NewGuid();

        _driverRepository.FindByIdAsync(driverId, Arg.Any<CancellationToken>())
            .Returns(new DriverEntity { Id = driverId, UserId = driverOwnerId, FullName = "Driver B", LicenseNumber = "L002", LicenseType = DriverLicenseType.B2, PhoneNumber = "0912345678" });
        _vehicleRepository.GetByIdAsync(vehicleId)
            .Returns(new VehicleEntity { Id = vehicleId, OwnerId = vehicleOwnerId, VehiclePlate = "30A-99999", VehicleType = VehicleType.Car, SeatCapacity = 5 });

        var dto = ValidDto() with { DriverId = driverId, VehicleId = vehicleId };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldHaveValidationErrorFor("Driver & Vehicle Owner")
            .WithErrorMessage("Driver and vehicle must belong to the same TransportProvider.");
    }

    [Fact]
    public async Task Validate_DriverOnly_NoOwnerCheck()
    {
        var driverId = Guid.NewGuid();

        var dto = ValidDto() with { DriverId = driverId, VehicleId = null };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldNotHaveValidationErrorFor("Driver & Vehicle Owner");
        await _vehicleRepository.Received(0).GetByIdAsync(Arg.Any<Guid>());
    }

    [Fact]
    public async Task Validate_VehicleOnly_NoOwnerCheck()
    {
        var vehicleId = Guid.NewGuid();

        var dto = ValidDto() with { DriverId = null, VehicleId = vehicleId };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldNotHaveValidationErrorFor("Driver & Vehicle Owner");
        await _driverRepository.Received(0).FindByIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Validate_DriverNotFound_NoOwnerCheck()
    {
        var driverId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();

        _driverRepository.FindByIdAsync(driverId, Arg.Any<CancellationToken>())
            .Returns((DriverEntity?)null);
        _vehicleRepository.GetByIdAsync(vehicleId)
            .Returns(new VehicleEntity { Id = vehicleId, OwnerId = Guid.NewGuid(), VehiclePlate = "30A-11111", VehicleType = VehicleType.Car, SeatCapacity = 5 });

        var dto = ValidDto() with { DriverId = driverId, VehicleId = vehicleId };
        var result = await _validator.TestValidateAsync(dto);
        // When either entity is null, rule passes (owner cannot be mismatched)
        result.ShouldNotHaveValidationErrorFor("Driver & Vehicle Owner");
    }

    [Fact]
    public async Task Validate_VehicleNotFound_NoContinentCheck()
    {
        var vehicleId = Guid.NewGuid();

        _vehicleRepository.GetByIdAsync(vehicleId)
            .Returns((VehicleEntity?)null);

        var dto = ValidDto() with { VehicleId = vehicleId };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldNotHaveValidationErrorFor(x => x.VehicleId);
        await _routeTransportRepository.Received(0).GetTourContinentByRouteIdAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    #endregion

    #region Continent Matching

    [Fact]
    public async Task Validate_VehicleLocationAreaMatchesTourContinent_Passes()
    {
        var vehicleId = Guid.NewGuid();
        var tourRouteId = Guid.NewGuid();

        _vehicleRepository.GetByIdAsync(vehicleId)
            .Returns(new VehicleEntity { Id = vehicleId, OwnerId = Guid.NewGuid(), VehiclePlate = "30A-55555", VehicleType = VehicleType.Car, SeatCapacity = 5, LocationArea = Continent.Asia });
        _routeTransportRepository.GetTourContinentByRouteIdAsync(tourRouteId, Arg.Any<CancellationToken>())
            .Returns(Continent.Asia);

        var dto = ValidDto() with { TourPlanRouteId = tourRouteId, VehicleId = vehicleId };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public async Task Validate_VehicleLocationAreaDoesNotMatchTourContinent_Fails()
    {
        var vehicleId = Guid.NewGuid();
        var tourRouteId = Guid.NewGuid();

        _vehicleRepository.GetByIdAsync(vehicleId)
            .Returns(new VehicleEntity { Id = vehicleId, OwnerId = Guid.NewGuid(), VehiclePlate = "30A-66666", VehicleType = VehicleType.Car, SeatCapacity = 5, LocationArea = Continent.Europe });
        _routeTransportRepository.GetTourContinentByRouteIdAsync(tourRouteId, Arg.Any<CancellationToken>())
            .Returns(Continent.Asia);

        var dto = ValidDto() with { TourPlanRouteId = tourRouteId, VehicleId = vehicleId };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldHaveValidationErrorFor(x => x.VehicleId)
            .WithErrorMessage("Vehicle's location area must match the tour's continent.");
    }

    [Fact]
    public async Task Validate_VehicleHasNoLocationArea_Passes()
    {
        var vehicleId = Guid.NewGuid();
        var tourRouteId = Guid.NewGuid();

        _vehicleRepository.GetByIdAsync(vehicleId)
            .Returns(new VehicleEntity { Id = vehicleId, OwnerId = Guid.NewGuid(), VehiclePlate = "30A-77777", VehicleType = VehicleType.Car, SeatCapacity = 5, LocationArea = null });
        _routeTransportRepository.GetTourContinentByRouteIdAsync(tourRouteId, Arg.Any<CancellationToken>())
            .Returns(Continent.Asia);

        var dto = ValidDto() with { TourPlanRouteId = tourRouteId, VehicleId = vehicleId };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public async Task Validate_TourHasNoContinent_Passes()
    {
        var vehicleId = Guid.NewGuid();
        var tourRouteId = Guid.NewGuid();

        _vehicleRepository.GetByIdAsync(vehicleId)
            .Returns(new VehicleEntity { Id = vehicleId, OwnerId = Guid.NewGuid(), VehiclePlate = "30A-88888", VehicleType = VehicleType.Car, SeatCapacity = 5, LocationArea = Continent.Europe });
        _routeTransportRepository.GetTourContinentByRouteIdAsync(tourRouteId, Arg.Any<CancellationToken>())
            .Returns((Continent?)null);

        var dto = ValidDto() with { TourPlanRouteId = tourRouteId, VehicleId = vehicleId };
        var result = await _validator.TestValidateAsync(dto);
        result.ShouldNotHaveAnyValidationErrors();
    }

    #endregion
}
