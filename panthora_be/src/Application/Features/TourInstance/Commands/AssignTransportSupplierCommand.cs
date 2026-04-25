using Application.Common.Authorization;
using Application.Common.Constant;
using Application.Common;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;
/// <summary>
/// Assign (or change) the transport supplier for a specific transportation activity.
/// Mirrors <see cref="AssignAccommodationSupplierCommand"/> for the transport side.
/// Calls <see cref="Domain.Entities.TourInstanceDayActivityEntity.AssignTransportSupplier"/>
/// which resets TransportationApprovalStatus to Pending, clears VehicleId/DriverId,
/// and sets the RequestedVehicleType + RequestedSeatCount plan.
/// </summary>
public sealed record AssignTransportSupplierCommand(
    [property: JsonPropertyName("instanceId")] Guid InstanceId,
    [property: JsonPropertyName("transportationActivityId")] Guid TransportationActivityId,
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("requestedVehicleType")] VehicleType RequestedVehicleType,
    [property: JsonPropertyName("requestedSeatCount")] int RequestedSeatCount,
    // Scope addendum 2026-04-23 — manager-specified vehicle count (nullable).
    int? RequestedVehicleCount = null
) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class AssignTransportSupplierCommandValidator : AbstractValidator<AssignTransportSupplierCommand>
{
    public AssignTransportSupplierCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty();
        RuleFor(x => x.TransportationActivityId).NotEmpty();
        RuleFor(x => x.SupplierId).NotEmpty();
        RuleFor(x => x.RequestedVehicleType).IsInEnum();
        RuleFor(x => x.RequestedSeatCount).GreaterThan(0)
            .WithMessage("Số ghế yêu cầu phải lớn hơn 0.");
        RuleFor(x => x.RequestedVehicleCount)
            .GreaterThan(0)
            .When(x => x.RequestedVehicleCount.HasValue)
            .WithMessage("Số xe yêu cầu phải lớn hơn 0.");
    }
}

public sealed class AssignTransportSupplierCommandHandler(
    ITourInstanceRepository tourInstanceRepository,
    ISupplierRepository supplierRepository,
    IVehicleBlockRepository vehicleBlockRepository,
    IVehicleRepository vehicleRepository,
    IUser user,
    ITourInstanceNotificationBroadcaster? notifications = null
) : ICommandHandler<AssignTransportSupplierCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(AssignTransportSupplierCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(user.Id, out _))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);

        var roleCheck = TourInstanceRoleGuard.Require(user, TourInstanceRoleGuard.ManagementRoles);
        if (roleCheck.IsError) return roleCheck.Errors;

        // Validate supplier exists and is a transport type
        var supplier = await supplierRepository.GetByIdAsync(request.SupplierId, cancellationToken);
        if (supplier is null)
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, ErrorConstants.Supplier.NotFoundDescription);

        if (supplier.SupplierType != SupplierType.Transport)
            return Error.Validation("Supplier.WrongType", "Nhà cung cấp phải thuộc loại Transportation (Vận chuyển).");

        if (!supplier.IsActive)
            return Error.Validation("Supplier.Inactive", $"Nhà cung cấp '{supplier.Name}' đang ngừng hoạt động.");

        // Load instance with days (needed for seat vs MaxParticipation + fleet guard)
        var instance = await tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(request.InstanceId, cancellationToken);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        if (request.RequestedSeatCount * (request.RequestedVehicleCount ?? 1) < instance.MaxParticipation)
        {
            return Error.Validation(
                TourInstanceTransportErrors.SeatCountBelowCapacityCode,
                TourInstanceTransportErrors.SeatCountBelowCapacityDescription);
        }

        // Scope addendum 2026-04-23: guard manager's vehicle count against the supplier's
        // assignable fleet (supplier-scoped + legacy owner pool) before touching the instance graph.
        if (request.RequestedVehicleCount is { } requestedCount)
        {
            var fleetSize = await vehicleRepository.CountActiveByTransportSupplierFleetAsync(
                request.SupplierId,
                supplier.OwnerUserId,
                request.RequestedVehicleType,
                cancellationToken);
            if (requestedCount > fleetSize)
            {
                return Error.Validation(
                    TourInstanceTransportErrors.VehicleCountExceedsFleetCode,
                    TourInstanceTransportErrors.VehicleCountExceedsFleetDescription);
            }
        }

        // Find the transportation activity
        var activity = instance.InstanceDays
            .SelectMany(d => d.Activities)
            .FirstOrDefault(a => a.Id == request.TransportationActivityId);

        if (activity is null)
            return Error.NotFound("TourInstanceActivity.NotFound", "Hoạt động vận chuyển không tìm thấy.");

        if (activity.ActivityType != TourDayActivityType.Transportation)
            return Error.Validation("TourInstanceActivity.InvalidType", "Hoạt động này không phải loại vận chuyển.");

        // Remove any hard holds tied to this activity (single or multi-vehicle) before resetting supplier/plan.
        await vehicleBlockRepository.DeleteByActivityAsync(activity.Id, cancellationToken);

        var previousSupplierId = activity.TransportSupplierId;
        var supplierChanging = previousSupplierId.HasValue && previousSupplierId != request.SupplierId;

        // Assign supplier — resets approval to Pending, clears vehicle/driver + assignment rows
        activity.AssignTransportSupplier(
            request.SupplierId,
            request.RequestedVehicleType,
            request.RequestedSeatCount,
            request.RequestedVehicleCount);

        // If instance was Available, move back to PendingApproval since a new supplier needs to approve
        if (instance.Status == TourInstanceStatus.Available)
        {
            instance.Status = TourInstanceStatus.PendingApproval;
        }

        await tourInstanceRepository.Update(instance, cancellationToken);

        // ER-13: fire Released + Assigned notifications (fire-and-forget; broadcaster optional).
        if (notifications is not null)
        {
            try
            {
                if (supplierChanging && previousSupplierId.HasValue)
                {
                    await notifications.NotifyProviderReleasedAsync(
                        previousSupplierId.Value,
                        activity.Id,
                        instance.Id,
                        reason: "supplier-changed",
                        ct: cancellationToken);
                }

                await notifications.NotifyProviderAssignedAsync(
                    request.SupplierId,
                    activity.Id,
                    instance.Id,
                    cancellationToken);
            }
            catch
            {
                // Notifications must never break the assignment flow.
            }
        }

        return Result.Success;
    }
}
