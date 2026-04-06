namespace Application.Features.TourTransportAssignment.Validators;

using Application.Features.TourTransportAssignment.DTOs;
using Domain.Common.Repositories;
using FluentValidation;

public sealed class RouteTransportAssignmentRequestDtoValidator
    : AbstractValidator<RouteTransportAssignmentRequestDto>
{
    private readonly IVehicleRepository _vehicleRepository;
    private readonly IDriverRepository _driverRepository;
    private readonly ITourDayActivityRouteTransportRepository _routeTransportRepository;

    public RouteTransportAssignmentRequestDtoValidator(
        IVehicleRepository vehicleRepository,
        IDriverRepository driverRepository,
        ITourDayActivityRouteTransportRepository routeTransportRepository)
    {
        _vehicleRepository = vehicleRepository;
        _driverRepository = driverRepository;
        _routeTransportRepository = routeTransportRepository;

        RuleFor(x => x.BookingActivityReservationId)
            .NotEmpty().WithMessage("Booking activity reservation ID is required.");

        RuleFor(x => x.TourPlanRouteId)
            .NotEmpty().WithMessage("Tour plan route ID is required.");

        RuleFor(x => x)
            .MustAsync(HaveSameOwner)
            .When(x => x.DriverId.HasValue && x.VehicleId.HasValue)
            .WithMessage("Driver and vehicle must belong to the same TransportProvider.");

        RuleFor(x => x)
            .MustAsync(HaveMatchingContinent)
            .When(x => x.VehicleId.HasValue)
            .WithMessage("Vehicle's location area must match the tour's continent.");
    }

    private async Task<bool> HaveSameOwner(
        RouteTransportAssignmentRequestDto dto,
        CancellationToken ct)
    {
        if (!dto.DriverId.HasValue || !dto.VehicleId.HasValue)
            return true;

        var driver = await _driverRepository.FindByIdAsync(dto.DriverId.Value, ct);
        var vehicle = await _vehicleRepository.GetByIdAsync(dto.VehicleId.Value);

        if (driver is null || vehicle is null)
            return true;

        return driver.UserId == vehicle.OwnerId;
    }

    private async Task<bool> HaveMatchingContinent(
        RouteTransportAssignmentRequestDto dto,
        CancellationToken ct)
    {
        if (!dto.VehicleId.HasValue)
            return true;

        var vehicle = await _vehicleRepository.GetByIdAsync(dto.VehicleId.Value);
        if (vehicle is null || !vehicle.LocationArea.HasValue)
            return true;

        var tourContinent = await _routeTransportRepository.GetTourContinentByRouteIdAsync(
            dto.TourPlanRouteId, ct);

        if (!tourContinent.HasValue)
            return true;

        return vehicle.LocationArea.Value == tourContinent.Value;
    }
}
