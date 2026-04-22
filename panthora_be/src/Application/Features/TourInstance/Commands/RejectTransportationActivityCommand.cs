using Application.Common;
using Application.Common.Authorization;
using Application.Common.Constant;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using BuildingBlocks.CORS;

namespace Application.Features.TourInstance.Commands;

/// <summary>
/// Reject transportation for a specific activity — the transport provider
/// declines the assignment. Deletes any existing VehicleBlock and resets
/// the instance back to PendingApproval if it was Available.
/// </summary>
public sealed record RejectTransportationActivityCommand(
    Guid InstanceId,
    Guid ActivityId,
    string? Note = null
) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class RejectTransportationActivityCommandValidator : AbstractValidator<RejectTransportationActivityCommand>
{
    public RejectTransportationActivityCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty();
        RuleFor(x => x.ActivityId).NotEmpty();
    }
}

public sealed class RejectTransportationActivityCommandHandler(
    ITourInstanceRepository tourInstanceRepository,
    ISupplierRepository supplierRepository,
    IVehicleBlockRepository vehicleBlockRepository,
    IUser user
) : ICommandHandler<RejectTransportationActivityCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(RejectTransportationActivityCommand request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(user.Id, out var currentUserId))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription);

        var roleCheck = TourInstanceRoleGuard.Require(user, TourInstanceRoleGuard.ProviderRoles);
        if (roleCheck.IsError) return roleCheck.Errors;

        // Load instance with full graph
        var instance = await tourInstanceRepository.FindByIdWithInstanceDays(request.InstanceId, cancellationToken);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        // Find activity
        var activity = instance.InstanceDays
            .SelectMany(d => d.Activities)
            .FirstOrDefault(a => a.Id == request.ActivityId);

        if (activity is null)
            return Error.NotFound("TourInstanceActivity.NotFound", "Hoạt động vận chuyển không tìm thấy.");

        if (activity.ActivityType != TourDayActivityType.Transportation)
            return Error.Validation("TourInstanceActivity.InvalidType", "Hoạt động này không phải loại vận chuyển.");

        if (!activity.TransportSupplierId.HasValue)
            return Error.Validation("TourInstanceActivity.NoSupplier", "Hoạt động chưa được gán nhà cung cấp vận chuyển.");

        // Verify caller owns the supplier
        var suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(currentUserId, cancellationToken);
        if (suppliers.Count == 0 || !suppliers.Any(s => s.Id == activity.TransportSupplierId.Value))
            return Error.Validation(
                TourInstanceTransportErrors.ProviderNotAssignedCode,
                "Bạn không phải nhà cung cấp vận chuyển cho hoạt động này.");

        // Delete VehicleBlock if any was created for this activity
        await vehicleBlockRepository.DeleteByActivityAsync(request.ActivityId, cancellationToken);

        // Domain method: set Rejected, clear vehicle/driver
        activity.RejectTransportation(request.Note);

        // If instance was Available, move back to PendingApproval
        if (instance.Status == TourInstanceStatus.Available)
        {
            instance.Status = TourInstanceStatus.PendingApproval;
        }

        await tourInstanceRepository.Update(instance, cancellationToken);
        return Result.Success;
    }
}
