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
/// Assign (or change) the hotel supplier for a specific accommodation activity.
/// Sets SupplierApprovalStatus to Pending and clears any previous approval note.
/// </summary>
public sealed record AssignAccommodationSupplierCommand(
    Guid InstanceId,
    Guid AccommodationActivityId,
    Guid SupplierId
) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class AssignAccommodationSupplierCommandValidator : AbstractValidator<AssignAccommodationSupplierCommand>
{
    public AssignAccommodationSupplierCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty();
        RuleFor(x => x.AccommodationActivityId).NotEmpty();
        RuleFor(x => x.SupplierId).NotEmpty();
    }
}

public sealed class AssignAccommodationSupplierCommandHandler(
    ITourInstanceRepository tourInstanceRepository,
    ISupplierRepository supplierRepository,
    IRoomBlockRepository roomBlockRepository,
    IUser user,
    ITourInstanceNotificationBroadcaster? notifications = null
) : ICommandHandler<AssignAccommodationSupplierCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(AssignAccommodationSupplierCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(user.Id, out _))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);

        var roleCheck = TourInstanceRoleGuard.Require(user, TourInstanceRoleGuard.ManagementRoles);
        if (roleCheck.IsError) return roleCheck.Errors;

        // Validate supplier exists and is a hotel type
        var supplier = await supplierRepository.GetByIdAsync(request.SupplierId, cancellationToken);
        if (supplier is null)
            return Error.NotFound(ErrorConstants.Supplier.NotFoundCode, ErrorConstants.Supplier.NotFoundDescription);

        if (supplier.SupplierType != SupplierType.Accommodation)
            return Error.Validation("Supplier.WrongType", "Nhà cung cấp phải thuộc loại Accommodation (Khách sạn).");

        // Load instance with days
        var instance = await tourInstanceRepository.FindByIdWithInstanceDays(request.InstanceId, cancellationToken);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        // Find the accommodation activity
        var activity = instance.InstanceDays
            .SelectMany(d => d.Activities)
            .FirstOrDefault(a => a.Id == request.AccommodationActivityId);

        if (activity is null)
            return Error.NotFound("TourInstanceActivity.NotFound", "Hoạt động lưu trú không tìm thấy.");

        if (activity.ActivityType != TourDayActivityType.Accommodation)
            return Error.Validation("TourInstanceActivity.InvalidType", "Hoạt động này không phải loại lưu trú.");

        if (activity.Accommodation is null)
            return Error.Validation("TourInstanceActivity.NoAccommodation", "Hoạt động lưu trú chưa có thông tin phòng.");

        var previousSupplierId = activity.Accommodation.SupplierId;
        bool isSupplierChanged = previousSupplierId.HasValue && previousSupplierId.Value != request.SupplierId;

        // Assign supplier — resets approval to Pending
        activity.Accommodation.AssignSupplier(request.SupplierId);

        if (isSupplierChanged)
        {
            // Delete any stale room blocks hold by the previous supplier
            await roomBlockRepository.DeleteByTourInstanceDayActivityIdAsync(activity.Id, cancellationToken);
        }

        // If instance was Available, move back to PendingApproval since a new supplier needs to approve
        if (instance.Status == TourInstanceStatus.Available)
        {
            instance.Status = TourInstanceStatus.PendingApproval;
        }

        await tourInstanceRepository.Update(instance, cancellationToken);

        // ER-13: fire Released + Assigned notifications (fire-and-forget).
        if (notifications is not null)
        {
            try
            {
                if (isSupplierChanged && previousSupplierId.HasValue)
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
