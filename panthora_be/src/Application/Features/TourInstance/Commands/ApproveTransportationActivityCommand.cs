using System.Data;
using Application.Common;
using Application.Common.Authorization;
using Application.Common.Constant;
using Application.Common.Interfaces;
using Contracts.Interfaces;
using Domain;
using Domain.Common.Repositories;
using Domain.Enums;
using Domain.Entities;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using BuildingBlocks.CORS;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Commands;

/// <summary>One vehicle row in a multi-vehicle approve request (or single-row legacy body).</summary>
public sealed record TransportApprovalAssignmentDto(
    [property: JsonPropertyName("vehicleId")] Guid VehicleId,
    [property: JsonPropertyName("driverId")] Guid? DriverId);

/// <summary>
/// Approve transportation for a specific activity — the transport provider
/// confirms one or more vehicle + driver assignments.
/// One transaction: ownership check → validate fleet → availability per vehicle →
/// delete stale VehicleBlock → replace assignment rows → domain ApproveTransportation (legacy mirror) →
/// insert Hard VehicleBlock per vehicle → CheckAndActivateTourInstance.
/// </summary>
public sealed record ApproveTransportationActivityCommand(
    [property: JsonPropertyName("instanceId")] Guid InstanceId,
    [property: JsonPropertyName("activityId")] Guid ActivityId,
    [property: JsonPropertyName("assignments")] IReadOnlyList<TransportApprovalAssignmentDto>? Assignments,
    [property: JsonPropertyName("vehicleId")] /// <summary>Legacy single-pair shim when <see cref="Assignments"/> is null or empty.</summary>
    Guid? VehicleId = null,
    [property: JsonPropertyName("driverId")] Guid? DriverId = null,
    [property: JsonPropertyName("note")] string? Note = null) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourInstance];
}

public sealed class ApproveTransportationActivityCommandValidator : AbstractValidator<ApproveTransportationActivityCommand>
{
    public ApproveTransportationActivityCommandValidator()
    {
        RuleFor(x => x.InstanceId).NotEmpty();
        RuleFor(x => x.ActivityId).NotEmpty();
        RuleFor(x => x)
            .Must(cmd => (cmd.Assignments is { Count: > 0 }) || (cmd.VehicleId.HasValue && cmd.DriverId.HasValue))
            .WithMessage("Cần danh sách Assignments hoặc cặp VehicleId + DriverId.");
        When(x => x.Assignments is { Count: > 0 }, () =>
        {
            RuleForEach(x => x.Assignments!)
                .ChildRules(a =>
                {
                    a.RuleFor(r => r.VehicleId).NotEmpty();
                    a.RuleFor(r => r.DriverId).NotEmpty()
                        .WithMessage("Mỗi xe phải có tài xế (DriverId).");
                });
        });
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

        var normalized = NormalizeAssignments(request);
        if (normalized.Count == 0)
            return Error.Validation("TourInstanceActivity.NoAssignments", "Danh sách xe duyệt không được rỗng.");

        if (TourInstanceTransportAssignmentRules.HasDuplicateVehicleIds(normalized.Select(x => x.VehicleId)))
        {
            return Error.Validation(
                TourInstanceTransportErrors.DuplicateVehicleInActivityCode,
                TourInstanceTransportErrors.DuplicateVehicleInActivityDescription);
        }

        var instance = await tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(request.InstanceId, cancellationToken);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription);

        var activity = instance.InstanceDays
            .SelectMany(d => d.Activities)
            .FirstOrDefault(a => a.Id == request.ActivityId);

        if (activity is null)
            return Error.NotFound("TourInstanceActivity.NotFound", "Hoạt động vận chuyển không tìm thấy.");

        if (activity.ActivityType != TourDayActivityType.Transportation)
            return Error.Validation("TourInstanceActivity.InvalidType", "Hoạt động này không phải loại vận chuyển.");

        if (!activity.TransportSupplierId.HasValue)
            return Error.Validation("TourInstanceActivity.NoSupplier", "Hoạt động chưa được gán nhà cung cấp vận chuyển.");

        var suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(currentUserId, cancellationToken);
        if (suppliers.Count == 0 || !suppliers.Any(s => s.Id == activity.TransportSupplierId.Value))
            return Error.Validation(
                TourInstanceTransportErrors.ProviderNotAssignedCode,
                "Bạn không phải nhà cung cấp vận chuyển cho hoạt động này.");

        if (IsIdempotentApproved(activity, normalized))
            return Result.Success;

        // Strict vehicle-count guard (scope addendum 2026-04-23): when manager pre-specifies
        // how many vehicles are required, provider must approve with exactly that many rows.
        if (activity.RequestedVehicleCount is { } requiredCount && normalized.Count != requiredCount)
        {
            return Error.Validation(
                TourInstanceTransportErrors.VehicleCountMismatchCode,
                TourInstanceTransportErrors.VehicleCountMismatchDescription);
        }

        var requiredSeats = activity.RequestedSeatCount ?? instance.MaxParticipation;

        // Pre-load and validate all vehicles & drivers (outside transaction; repeated inside tx for races).
        var vehicleEntities = new List<(Guid Id, VehicleEntity Entity)>();
        foreach (var row in normalized)
        {
            var vehicle = await vehicleRepository.GetByIdAsync(row.VehicleId, cancellationToken);
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

            if (activity.RequestedVehicleType.HasValue && vehicle.VehicleType != activity.RequestedVehicleType.Value)
                return Error.Validation(
                    TourInstanceTransportErrors.VehicleWrongTypeCode,
                    $"Loại xe ({vehicle.VehicleType}) không khớp với yêu cầu ({activity.RequestedVehicleType}).");

            if (row.DriverId == Guid.Empty)
                return Error.Validation("Driver.Required", "Mỗi xe phải có tài xế.");

            var driver = await driverRepository.GetByIdAsync(row.DriverId, cancellationToken);
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

            vehicleEntities.Add((vehicle.Id, vehicle));
        }

        var totalSeatCapacity = vehicleEntities.Sum(v => v.Entity.SeatCapacity);
        if (!TourInstanceTransportAssignmentRules.SeatCapacityCoversRequest(totalSeatCapacity, requiredSeats))
        {
            if (normalized.Count == 1)
            {
                return Error.Validation(
                    TourInstanceTransportErrors.VehicleInsufficientCapacityCode,
                    $"Sức chứa của xe ({totalSeatCapacity}) không đủ cho số ghế yêu cầu ({requiredSeats}).");
            }

            return Error.Validation(
                TourInstanceTransportErrors.TransportFleetInsufficientCapacityCode,
                TourInstanceTransportErrors.TransportFleetInsufficientCapacityDescription);
        }

        var activityDate = activity.TourInstanceDay.ActualDate;
        foreach (var row in normalized)
        {
            var availabilityCheck = await availabilityService.CheckVehicleAvailabilityAsync(
                row.VehicleId, activityDate, request.ActivityId, cancellationToken);

            if (availabilityCheck.IsError) return availabilityCheck.Errors;
            if (!availabilityCheck.Value)
                return Error.Validation(
                    TourInstanceTransportErrors.VehicleUnavailableCode,
                    "Xe đã được gán cho một lịch trình khác trong cùng ngày.");
        }

        const int maxAttempts = 3;
        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                await unitOfWork.ExecuteTransactionAsync(IsolationLevel.RepeatableRead, async () =>
                {
                    foreach (var row in normalized)
                    {
                        var txCheck = await availabilityService.CheckVehicleAvailabilityAsync(
                            row.VehicleId, activityDate, request.ActivityId, cancellationToken);
                        if (txCheck.IsError || !txCheck.Value)
                        {
                            throw new TransportApproveConflictException(
                                TourInstanceTransportErrors.VehicleUnavailableCode,
                                "Xe đã được gán cho một lịch trình khác trong cùng ngày.");
                        }
                    }

                    await vehicleBlockRepository.DeleteByActivityAsync(request.ActivityId, cancellationToken);

                    activity.TransportAssignments.Clear();

                    var performedBy = currentUserId.ToString();
                    foreach (var row in normalized)
                    {
                        var seatSnap = vehicleEntities.First(v => v.Id == row.VehicleId).Entity.SeatCapacity;
                        activity.TransportAssignments.Add(
                            TourInstanceTransportAssignmentEntity.Create(
                                activity.Id,
                                row.VehicleId,
                                row.DriverId,
                                seatSnap,
                                performedBy));
                    }

                    var primary = normalized[0];
                    activity.ApproveTransportation(primary.VehicleId, primary.DriverId, request.Note);

                    foreach (var row in normalized)
                    {
                        var block = VehicleBlockEntity.Create(
                            row.VehicleId,
                            activityDate,
                            performedBy,
                            tourInstanceDayActivityId: request.ActivityId,
                            holdStatus: HoldStatus.Hard);

                        await vehicleBlockRepository.AddAsync(block, cancellationToken);
                    }

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
                return Error.Validation(
                    TourInstanceTransportErrors.VehicleUnavailableCode,
                    "Xe đã được gán cho một lịch trình khác trong cùng ngày.");
            }
            catch (DbUpdateException dbEx) when (IsPostgresSqlState(dbEx, "40001") && attempt < maxAttempts)
            {
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
                var reloaded = await tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(request.InstanceId, cancellationToken);
                var reloadedActivity = reloaded?.InstanceDays
                    .SelectMany(d => d.Activities)
                    .FirstOrDefault(a => a.Id == request.ActivityId);

                if (reloadedActivity is not null && IsIdempotentApproved(reloadedActivity, normalized))
                    return Result.Success;

                if (attempt < maxAttempts && reloaded is not null)
                {
                    await Task.Delay(50 * attempt, cancellationToken);
                    instance = reloaded;
                    activity = instance.InstanceDays.SelectMany(d => d.Activities).First(a => a.Id == request.ActivityId);
                    continue;
                }

                return Error.Conflict(
                    TourInstanceTransportErrors.VehicleUnavailableCode,
                    "Hệ thống đang bận; vui lòng thử lại.");
            }
        }

        return Error.Failure("Vehicle.Unavailable", "Không thể duyệt phương tiện sau nhiều lần thử.");
    }

    private static List<(Guid VehicleId, Guid DriverId)> NormalizeAssignments(ApproveTransportationActivityCommand request)
    {
        if (request.Assignments is { Count: > 0 })
            return request.Assignments
                .Where(a => a.VehicleId != Guid.Empty)
                .Select(a => (a.VehicleId, a.DriverId ?? Guid.Empty))
                .ToList();

        if (request.VehicleId.HasValue && request.DriverId.HasValue)
            return [(request.VehicleId.Value, request.DriverId.Value)];

        return [];
    }

    private static bool IsIdempotentApproved(
        TourInstanceDayActivityEntity activity,
        IReadOnlyList<(Guid VehicleId, Guid DriverId)> normalized)
    {
        if (activity.TransportationApprovalStatus != ProviderApprovalStatus.Approved)
            return false;

        var next = normalized.OrderBy(x => x.VehicleId).ToList();

        if (activity.TransportAssignments.Count > 0)
        {
            var cur = activity.TransportAssignments
                .OrderBy(x => x.VehicleId)
                .Select(x => (x.VehicleId, x.DriverId ?? Guid.Empty))
                .ToList();
            if (cur.Count != next.Count)
                return false;
            for (var i = 0; i < cur.Count; i++)
            {
                if (cur[i].VehicleId != next[i].VehicleId || cur[i].Item2 != next[i].DriverId)
                    return false;
            }

            return true;
        }

        return next.Count == 1
               && activity.VehicleId == next[0].VehicleId
               && activity.DriverId == next[0].DriverId;
    }

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
    [JsonPropertyName("string")]
    public None stringCode = code;
}
