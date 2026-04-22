using Application.Common;
using Application.Common.Authorization;
using Application.Common.Constant;
using Application.Services;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using BuildingBlocks.CORS;

namespace Application.Features.TourInstance.Commands;

/// <summary>
/// Assign (or change) the transport supplier for a specific transportation activity.
/// Mirrors <see cref="AssignAccommodationSupplierCommand"/> for the transport side.
/// Calls <see cref="Domain.Entities.TourInstanceDayActivityEntity.AssignTransportSupplier"/>
/// which resets TransportationApprovalStatus to Pending, clears VehicleId/DriverId,
/// and sets the RequestedVehicleType + RequestedSeatCount plan.
/// </summary>
public sealed record AssignTransportSupplierCommand(
    Guid InstanceId,
    Guid TransportationActivityId,
    Guid SupplierId,
    VehicleType RequestedVehicleType,
    int RequestedSeatCount
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
    }
}

public sealed class AssignTransportSupplierCommandHandler(
    ITourInstanceRepository tourInstanceRepository,
    ISupplierRepository supplierRepository,
    IVehicleBlockRepository vehicleBlockRepository,
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

        // Load instance with days
        var instance = await tourInstanceRepository.FindByIdWithInstanceDays(request.InstanceId, cancellationToken);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        // Find the transportation activity
        var activity = instance.InstanceDays
            .SelectMany(d => d.Activities)
            .FirstOrDefault(a => a.Id == request.TransportationActivityId);

        if (activity is null)
            return Error.NotFound("TourInstanceActivity.NotFound", "Hoạt động vận chuyển không tìm thấy.");

        if (activity.ActivityType != TourDayActivityType.Transportation)
            return Error.Validation("TourInstanceActivity.InvalidType", "Hoạt động này không phải loại vận chuyển.");

        // If supplier is changing from a previously approved one, delete the old VehicleBlock
        var previousSupplierId = activity.TransportSupplierId;
        var supplierChanging = previousSupplierId.HasValue && previousSupplierId != request.SupplierId;
        if (supplierChanging && activity.TransportationApprovalStatus == ProviderApprovalStatus.Approved)
        {
            await vehicleBlockRepository.DeleteByActivityAsync(activity.Id, cancellationToken);
        }

        // Assign supplier — resets approval to Pending, clears vehicle/driver
        activity.AssignTransportSupplier(request.SupplierId, request.RequestedVehicleType, request.RequestedSeatCount);

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
