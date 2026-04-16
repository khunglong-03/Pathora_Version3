using Application.Common;
using Application.Common.Constant;
using Application.Dtos;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using BuildingBlocks.CORS;

namespace Application.Features.TourInstance.Commands;

public sealed record AssignVehicleToRouteCommand(
    Guid InstanceId,
    Guid RouteId,
    Guid VehicleId,
    Guid DriverId) : ICommand<ErrorOr<AssignVehicleToRouteResponseDto>>;

public sealed class AssignVehicleToRouteCommandValidator : AbstractValidator<AssignVehicleToRouteCommand>
{
    public AssignVehicleToRouteCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty();
        RuleFor(x => x.RouteId).NotEmpty();
        RuleFor(x => x.VehicleId).NotEmpty();
        RuleFor(x => x.DriverId).NotEmpty();
    }
}

public sealed class AssignVehicleToRouteCommandHandler(
    ITourInstancePlanRouteRepository routeRepository,
    IVehicleRepository vehicleRepository,
    IDriverRepository driverRepository,
    ISupplierRepository supplierRepository,
    IUser currentUser)
    : ICommandHandler<AssignVehicleToRouteCommand, ErrorOr<AssignVehicleToRouteResponseDto>>
{
    public async Task<ErrorOr<AssignVehicleToRouteResponseDto>> Handle(AssignVehicleToRouteCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(currentUser.Id, out var currentUserId))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);

        var supplier = await supplierRepository.FindByOwnerUserIdAsync(currentUserId, cancellationToken);
        if (supplier is null)
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, "Current user is not associated with any supplier.");

        var route = await routeRepository.GetDetailsByIdAsync(request.RouteId, cancellationToken);
        if (route is null || route.TourInstanceDayActivity.TourInstanceDay.TourInstanceId != request.InstanceId)
            return Error.NotFound("TourInstancePlanRoute.NotFound", "Route not found for the specified tour instance.");

        var instance = route.TourInstanceDayActivity.TourInstanceDay.TourInstance;
        if (instance.TransportProviderId != supplier.Id)
            return Error.Validation("TourInstance.ProviderNotAssigned", "You are not assigned as the Transport provider for this tour instance.");

        var vehicle = await vehicleRepository.GetByIdAsync(request.VehicleId, cancellationToken);
        if (vehicle is null)
            return Error.Validation("Vehicle.NotOwned", "Vehicle does not belong to the current provider.");
        
        if (vehicle.IsDeleted || vehicle.OwnerId != currentUserId)
            return Error.Validation("Vehicle.NotOwned", "Vehicle does not belong to the current provider.");

        if (!vehicle.IsActive)
            return Error.Validation("Vehicle.Inactive", "Vehicle is inactive.");

        var driver = await driverRepository.GetByIdAsync(request.DriverId, cancellationToken);
        if (driver is null)
            return Error.Validation("Driver.NotOwned", "Driver does not belong to the current provider.");

        if (driver.UserId != currentUserId)
            return Error.Validation("Driver.NotOwned", "Driver does not belong to the current provider.");

        if (!driver.IsActive)
            return Error.Validation("Driver.Inactive", "Driver is inactive.");

        route.Update(
            vehicleId: request.VehicleId,
            driverId: request.DriverId,
            pickupLocation: route.PickupLocation,
            dropoffLocation: route.DropoffLocation,
            departureTime: route.DepartureTime,
            arrivalTime: route.ArrivalTime);

        routeRepository.Update(route);

        return new AssignVehicleToRouteResponseDto(
            Success: true,
            SeatCapacityWarning: vehicle.SeatCapacity < instance.MaxParticipation,
            VehicleSeatCapacity: vehicle.SeatCapacity,
            TourMaxParticipation: instance.MaxParticipation);
    }
}
