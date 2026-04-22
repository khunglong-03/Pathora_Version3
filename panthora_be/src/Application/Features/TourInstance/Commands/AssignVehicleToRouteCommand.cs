using Application.Common;
using Application.Common.Constant;
using Application.Common.Interfaces;
using Application.Dtos;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
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
    ITourInstanceRepository tourInstanceRepository,
    IVehicleRepository vehicleRepository,
    IDriverRepository driverRepository,
    ISupplierRepository supplierRepository,
    IVehicleBlockRepository vehicleBlockRepository,
    IResourceAvailabilityService availabilityService,
    IUnitOfWork unitOfWork,
    IUser currentUser)
    : ICommandHandler<AssignVehicleToRouteCommand, ErrorOr<AssignVehicleToRouteResponseDto>>
{
    public async Task<ErrorOr<AssignVehicleToRouteResponseDto>> Handle(AssignVehicleToRouteCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(currentUser.Id, out var currentUserId))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);

        var suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(currentUserId, cancellationToken);
        var supplier = suppliers.FirstOrDefault();
        if (supplier is null)
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, "Current user is not associated with any supplier.");

        var instance = await tourInstanceRepository.FindByIdWithInstanceDays(request.InstanceId, cancellationToken);
        if (instance is null)
            return Error.NotFound("TourInstance.NotFound", "Tour Instance not found.");

        var activity = instance.InstanceDays.SelectMany(d => d.Activities).FirstOrDefault(a => a.Id == request.RouteId);
        if (activity is null)
            return Error.NotFound("TourInstanceDayActivity.NotFound", "Activity not found for the specified tour instance.");

        if (instance.TransportProviderId != supplier.Id)
            return Error.Validation("TourInstance.ProviderNotAssigned", "You are not assigned as the Transport provider for this tour instance.");

        var vehicle = await vehicleRepository.GetByIdAsync(request.VehicleId, cancellationToken);
        if (vehicle is null || vehicle.IsDeleted || vehicle.OwnerId != currentUserId)
            return Error.Validation("Vehicle.NotOwned", "Vehicle does not belong to the current provider.");

        if (!vehicle.IsActive)
            return Error.Validation("Vehicle.Inactive", "Vehicle is inactive.");

        // Hard capacity check (seats)
        if (vehicle.SeatCapacity < instance.MaxParticipation)
        {
            return Error.Validation("Vehicle.InsufficientCapacity", $"Sức chứa của xe ({vehicle.SeatCapacity}) không đủ cho số khách tối đa của tour ({instance.MaxParticipation}).");
        }

        // Availability check (overlap)
        var availabilityCheck = await availabilityService.CheckVehicleAvailabilityAsync(
            request.VehicleId,
            activity.TourInstanceDay.ActualDate,
            request.RouteId,
            cancellationToken);

        if (availabilityCheck.IsError) return availabilityCheck.Errors;
        if (!availabilityCheck.Value)
        {
            return Error.Validation("Vehicle.Unavailable", "Xe đã được gán cho một lịch trình khác trong cùng ngày.");
        }

        var driver = await driverRepository.GetByIdAsync(request.DriverId, cancellationToken);
        if (driver is null || driver.UserId != currentUserId)
            return Error.Validation("Driver.NotOwned", "Driver does not belong to the current provider.");

        if (!driver.IsActive)
            return Error.Validation("Driver.Inactive", "Driver is inactive.");

        await unitOfWork.ExecuteTransactionAsync(async () =>
        {
            // Remove existing block for this activity if any
            await vehicleBlockRepository.DeleteByActivityAsync(request.RouteId, cancellationToken);

            activity.VehicleId = request.VehicleId;
            activity.DriverId = request.DriverId;

            // Create new hard hold block
            var block = VehicleBlockEntity.Create(
                request.VehicleId,
                activity.TourInstanceDay.ActualDate,
                currentUserId.ToString(),
                tourInstanceDayActivityId: request.RouteId,
                holdStatus: HoldStatus.Hard);

            await vehicleBlockRepository.AddAsync(block, cancellationToken);
            await tourInstanceRepository.Update(instance, cancellationToken);
            await unitOfWork.SaveChangeAsync(cancellationToken);
        });

        return new AssignVehicleToRouteResponseDto(
            Success: true,
            SeatCapacityWarning: false, // Hardened to error
            VehicleSeatCapacity: vehicle.SeatCapacity,
            TourMaxParticipation: instance.MaxParticipation);
    }
}
