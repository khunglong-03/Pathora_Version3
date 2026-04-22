using System.Data;
using Application.Common;
using Application.Common.Authorization;
using Application.Common.Constant;
using Application.Common.Interfaces;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using Domain.Entities;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using BuildingBlocks.CORS;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.TourInstance.Commands;

/// <summary>
/// Approve transportation for a specific activity — the transport provider
/// confirms vehicle + driver assignment.
/// One transaction: ownership check → vehicle capacity → availability →
/// delete stale VehicleBlock → domain ApproveTransportation →
/// insert Hard VehicleBlock → CheckAndActivateTourInstance.
/// </summary>
public sealed record ApproveTransportationActivityCommand(
    Guid InstanceId,
    Guid ActivityId,
    Guid VehicleId,
    Guid DriverId,
    string? Note = null
) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class ApproveTransportationActivityCommandValidator : AbstractValidator<ApproveTransportationActivityCommand>
{
    public ApproveTransportationActivityCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty();
        RuleFor(x => x.ActivityId).NotEmpty();
        RuleFor(x => x.VehicleId).NotEmpty();
        RuleFor(x => x.DriverId).NotEmpty();
    }
}

public sealed class ApproveTransportationActivityCommandHandler(
    ITourInstanceRepository tourInstanceRepository,
    ISupplierRepository supplierRepository,
    IVehicleRepository vehicleRepository,
    IDriverRepository driverRepository,
    IVehicleBlockRepository vehicleBlockRepository,
    IResourceAvailabilityService availabilityService,
    IUnitOfWork unitOfWork,
    IUser user
) : ICommandHandler<ApproveTransportationActivityCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ApproveTransportationActivityCommand request, CancellationToken cancellationToken)
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

        // Idempotent: if already approved with same vehicle+driver, return success
        if (activity.TransportationApprovalStatus == ProviderApprovalStatus.Approved
            && activity.VehicleId == request.VehicleId
            && activity.DriverId == request.DriverId)
        {
            return Result.Success;
        }

        // Validate vehicle (ER-5: prefer SupplierId match; fall back to OwnerId for rows
        // that have not been backfilled with SupplierId yet).
        var vehicle = await vehicleRepository.GetByIdAsync(request.VehicleId, cancellationToken);
        if (vehicle is null || vehicle.IsDeleted)
            return Error.Validation("Vehicle.NotOwned", "Phương tiện không thuộc quyền sở hữu của bạn.");

        bool vehicleBelongsToSupplier = vehicle.SupplierId.HasValue
            ? vehicle.SupplierId == activity.TransportSupplierId
            : vehicle.OwnerId == currentUserId;

        if (!vehicleBelongsToSupplier)
            return Error.Validation(
                TourInstanceTransportErrors.VehicleWrongSupplierCode,
                "Phương tiện không thuộc nhà cung cấp đã được gán cho hoạt động này.");

        if (!vehicle.IsActive)
            return Error.Validation("Vehicle.Inactive", "Phương tiện đang ngừng hoạt động.");

        // Vehicle type match (ER-6)
        if (activity.RequestedVehicleType.HasValue && vehicle.VehicleType != activity.RequestedVehicleType.Value)
            return Error.Validation(
                TourInstanceTransportErrors.VehicleWrongTypeCode,
                $"Loại xe ({vehicle.VehicleType}) không khớp với yêu cầu ({activity.RequestedVehicleType}).");

        // Seat capacity check
        var requiredSeats = activity.RequestedSeatCount ?? instance.MaxParticipation;
        if (vehicle.SeatCapacity < requiredSeats)
        {
            return Error.Validation(
                TourInstanceTransportErrors.VehicleInsufficientCapacityCode,
                $"Sức chứa của xe ({vehicle.SeatCapacity}) không đủ cho số ghế yêu cầu ({requiredSeats}).");
        }

        // Availability check (date overlap)
        var activityDate = activity.TourInstanceDay.ActualDate;
        var availabilityCheck = await availabilityService.CheckVehicleAvailabilityAsync(
            request.VehicleId, activityDate, request.ActivityId, cancellationToken);

        if (availabilityCheck.IsError) return availabilityCheck.Errors;
        if (!availabilityCheck.Value)
            return Error.Validation(
                TourInstanceTransportErrors.VehicleUnavailableCode,
                "Xe đã được gán cho một lịch trình khác trong cùng ngày.");

        // Validate driver (ER-5: prefer SupplierId match; fall back to UserId for rows
        // that have not been backfilled with SupplierId yet).
        var driver = await driverRepository.GetByIdAsync(request.DriverId, cancellationToken);
        if (driver is null)
            return Error.Validation("Driver.NotOwned", "Tài xế không thuộc quyền sở hữu của bạn.");

        bool driverBelongsToSupplier = driver.SupplierId.HasValue
            ? driver.SupplierId == activity.TransportSupplierId
            : driver.UserId == currentUserId;

        if (!driverBelongsToSupplier)
            return Error.Validation(
                TourInstanceTransportErrors.VehicleWrongSupplierCode,
                "Tài xế không thuộc nhà cung cấp đã được gán cho hoạt động này.");

        if (!driver.IsActive)
            return Error.Validation("Driver.Inactive", "Tài xế đang ngừng hoạt động.");

        // Execute in transaction at RepeatableRead isolation (ER-1/ER-11) with 3x retry on
        // Postgres serialization failures (SQLSTATE 40001). Unique violations (23505) indicate
        // another tour grabbed the vehicle first → map to Vehicle.Unavailable (ER-4).
        const int maxAttempts = 3;
        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                await unitOfWork.ExecuteTransactionAsync(IsolationLevel.RepeatableRead, async () =>
                {
                    // ER-1.3: re-check availability INSIDE the transaction, right before INSERT,
                    // to close the read-then-write race window.
                    var txCheck = await availabilityService.CheckVehicleAvailabilityAsync(
                        request.VehicleId, activityDate, request.ActivityId, cancellationToken);
                    if (txCheck.IsError || !txCheck.Value)
                    {
                        throw new TransportApproveConflictException(
                            TourInstanceTransportErrors.VehicleUnavailableCode,
                            "Xe đã được gán cho một lịch trình khác trong cùng ngày.");
                    }

                    await vehicleBlockRepository.DeleteByActivityAsync(request.ActivityId, cancellationToken);

                    activity.ApproveTransportation(request.VehicleId, request.DriverId, request.Note);

                    // Tour-level holds are always Hard. Soft holds are reserved for unpaid customer bookings.
                    var block = VehicleBlockEntity.Create(
                        request.VehicleId,
                        activityDate,
                        currentUserId.ToString(),
                        tourInstanceDayActivityId: request.ActivityId,
                        holdStatus: HoldStatus.Hard);

                    await vehicleBlockRepository.AddAsync(block, cancellationToken);

                    instance.CheckAndActivateTourInstance();

                    await tourInstanceRepository.Update(instance, cancellationToken);
                    await unitOfWork.SaveChangeAsync(cancellationToken);
                });

                return Result.Success;
            }
            catch (TransportApproveConflictException tce)
            {
                return Error.Validation(tce.Code, tce.Message);
            }
            catch (DbUpdateException dbEx) when (IsPostgresSqlState(dbEx, "23505"))
            {
                // Unique violation (VehicleId, BlockedDate, HoldStatus) — another request won.
                return Error.Validation(
                    TourInstanceTransportErrors.VehicleUnavailableCode,
                    "Xe đã được gán cho một lịch trình khác trong cùng ngày.");
            }
            catch (DbUpdateException dbEx) when (IsPostgresSqlState(dbEx, "40001") && attempt < maxAttempts)
            {
                // Serialization failure — safe to retry.
                await Task.Delay(50 * attempt, cancellationToken);
                continue;
            }
            catch (DbUpdateException dbEx) when (IsPostgresSqlState(dbEx, "40001"))
            {
                return Error.Conflict(
                    TourInstanceTransportErrors.VehicleUnavailableCode,
                    "Hệ thống đang bận; vui lòng thử lại.");
            }
            catch (DbUpdateConcurrencyException)
            {
                // ER-2: RowVersion conflict — another request already flipped status.
                // Reload and return success if target state was reached by someone else.
                var reloaded = await tourInstanceRepository.FindByIdWithInstanceDays(request.InstanceId, cancellationToken);
                var reloadedActivity = reloaded?.InstanceDays
                    .SelectMany(d => d.Activities)
                    .FirstOrDefault(a => a.Id == request.ActivityId);

                if (reloadedActivity is not null
                    && reloadedActivity.TransportationApprovalStatus == ProviderApprovalStatus.Approved
                    && reloadedActivity.VehicleId == request.VehicleId
                    && reloadedActivity.DriverId == request.DriverId)
                {
                    return Result.Success;
                }

                if (attempt < maxAttempts)
                {
                    await Task.Delay(50 * attempt, cancellationToken);
                    continue;
                }

                return Error.Conflict(
                    TourInstanceTransportErrors.VehicleUnavailableCode,
                    "Hệ thống đang bận; vui lòng thử lại.");
            }
        }

        // Unreachable: loop either returns Success or throws.
        return Error.Failure("Vehicle.Unavailable", "Không thể duyệt phương tiện sau nhiều lần thử.");
    }

    /// <summary>
    /// True when <paramref name="ex"/> (or any inner exception) is a Npgsql exception whose
    /// <c>SqlState</c> equals <paramref name="expectedState"/>. Uses duck-typing via reflection
    /// so Application layer stays DB-agnostic.
    /// </summary>
    private static bool IsPostgresSqlState(Exception ex, string expectedState)
    {
        for (var cur = (Exception?)ex; cur is not null; cur = cur.InnerException)
        {
            var prop = cur.GetType().GetProperty("SqlState");
            if (prop is not null && prop.GetValue(cur) as string == expectedState)
                return true;
        }
        return false;
    }
}

internal sealed class TransportApproveConflictException(string code, string message)
    : Exception(message)
{
    public string Code { get; } = code;
}
