using Application.Common.Authorization;
using Application.Common.Constant;
using Application.Common.Interfaces;
using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using Domain;
using ErrorOr;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Data;
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
            .WithMessage(ValidationMessages.TourInstanceTransportAssignmentsRequired);
        When(x => x.Assignments is { Count: > 0 }, () =>
        {
            RuleForEach(x => x.Assignments!)
                .ChildRules(a =>
                {
                    a.RuleFor(r => r.VehicleId).NotEmpty();
                    a.RuleFor(r => r.DriverId).NotEmpty()
                        .WithMessage(ValidationMessages.TourInstanceTransportDriverRequired);
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
    IUser user,
    ILogger<ApproveTransportationActivityCommandHandler> logger,
    ILanguageContext? languageContext = null
) : ICommandHandler<ApproveTransportationActivityCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ApproveTransportationActivityCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        if (!Guid.TryParse(user.Id, out var currentUserId))
            return Error.Unauthorized(ErrorConstants.User.UnauthorizedCode, ErrorConstants.User.UnauthorizedDescription.Resolve(lang));

        var roleCheck = TourInstanceRoleGuard.Require(user, TourInstanceRoleGuard.ProviderRoles);
        if (roleCheck.IsError) return roleCheck.Errors;

        var normalized = NormalizeAssignments(request);
        if (normalized.Count == 0)
            return Error.Validation(ErrorConstants.TourInstanceActivity.NoAssignmentsCode, ErrorConstants.TourInstanceActivity.NoAssignmentsDescription.Resolve(lang));

        if (TourInstanceTransportAssignmentRules.HasDuplicateDriverIds(normalized.Select(x => x.DriverId)))
        {
            return Error.Validation(
                TourInstanceTransportErrors.DuplicateDriverInActivityCode,
                TourInstanceTransportErrors.DuplicateDriverInActivityDescription.Resolve(lang));
        }

        var instance = await tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(request.InstanceId, cancellationToken);
        if (instance is null)
            return Error.NotFound(ErrorConstants.TourInstance.NotFoundCode, ErrorConstants.TourInstance.NotFoundDescription.Resolve(lang));

        var activity = instance.InstanceDays
            .SelectMany(d => d.Activities)
            .FirstOrDefault(a => a.Id == request.ActivityId);

        if (activity is null)
            return Error.NotFound(ErrorConstants.TourInstanceActivity.NotFoundCode, ErrorConstants.TourInstanceActivity.NotFoundDescription.Resolve(lang));

        if (activity.ActivityType != TourDayActivityType.Transportation)
            return Error.Validation(ErrorConstants.TourInstanceActivity.InvalidTypeCode, ErrorConstants.TourInstanceActivity.InvalidTypeDescription.Resolve(lang));

        if (!activity.TransportationType.HasValue
            || activity.TransportationType.Value.GetApprovalCategory() != TransportApprovalCategory.Ground)
        {
            return Error.Validation(
                TourInstanceTransportErrors.ActivityNotProviderManagedCode,
                TourInstanceTransportErrors.ActivityNotProviderManagedDescription.Resolve(lang));
        }

        if (!activity.TransportSupplierId.HasValue)
            return Error.Validation(ErrorConstants.TourInstanceActivity.NoSupplierCode, ErrorConstants.TourInstanceActivity.NoSupplierDescription.Resolve(lang));

        // In manager-driven mode (requestedVehicleType set): one vehicle record with quantity>1
        // represents multiple physical vehicles under the same DB ID, so duplicate IDs are valid.
        if (!activity.RequestedVehicleType.HasValue && TourInstanceTransportAssignmentRules.HasDuplicateVehicleIds(normalized.Select(x => x.VehicleId)))
        {
            return Error.Validation(
                TourInstanceTransportErrors.DuplicateVehicleInActivityCode,
                TourInstanceTransportErrors.DuplicateVehicleInActivityDescription.Resolve(lang));
        }

        var suppliers = await supplierRepository.FindAllByOwnerUserIdAsync(currentUserId, cancellationToken);
        if (suppliers.Count == 0 || !suppliers.Any(s => s.Id == activity.TransportSupplierId.Value))
            return Error.Validation(
                TourInstanceTransportErrors.ProviderNotAssignedCode,
                TourInstanceTransportErrors.ProviderNotAssignedDescription.Resolve(lang));

        if (IsIdempotentApproved(activity, normalized))
        {
            logger.LogWarning("[APPROVE-DIAG] Idempotent short-circuit: activity {Id} already approved with same assignments", request.ActivityId);
            return Result.Success;
        }

        // Strict vehicle-count guard (scope addendum 2026-04-23): when manager pre-specifies
        // how many vehicles are required, provider must approve with exactly that many rows.
        if (activity.RequestedVehicleCount is { } requiredCount && normalized.Count != requiredCount)
        {
            return Error.Validation(
                TourInstanceTransportErrors.VehicleCountMismatchCode,
                TourInstanceTransportErrors.VehicleCountMismatchDescription.Resolve(lang));
        }

        var requiredSeats = (activity.RequestedSeatCount * (activity.RequestedVehicleCount ?? 1)) ?? instance.MaxParticipation;

        // Pre-load and validate all vehicles & drivers (outside transaction; repeated inside tx for races).
        var vehicleEntities = new List<(Guid Id, VehicleEntity Entity)>();
        var loadedVehicleIds = new HashSet<Guid>();
        foreach (var row in normalized)
        {
            // Only load+validate each vehicle once (manager-driven mode may have duplicate IDs)
            if (!loadedVehicleIds.Contains(row.VehicleId))
            {
                var vehicle = await vehicleRepository.GetByIdAsync(row.VehicleId, cancellationToken);
                if (vehicle is null || vehicle.IsDeleted)
                    return Error.Validation(ErrorConstants.Vehicle.NotOwnedCode, ErrorConstants.Vehicle.NotOwnedDescription.Resolve(lang));

                bool vehicleBelongsToSupplier = vehicle.SupplierId.HasValue
                    ? vehicle.SupplierId == activity.TransportSupplierId
                    : vehicle.OwnerId == currentUserId;

                if (!vehicleBelongsToSupplier)
                    return Error.Validation(
                        TourInstanceTransportErrors.VehicleWrongSupplierCode,
                        TourInstanceTransportErrors.VehicleWrongSupplierDescription.Resolve(lang));

                if (!vehicle.IsActive)
                    return Error.Validation(ErrorConstants.Vehicle.InactiveCode, ErrorConstants.Vehicle.InactiveDescription.Resolve(lang));

                if (activity.RequestedVehicleType.HasValue && vehicle.VehicleType != activity.RequestedVehicleType.Value)
                {
                    var vehicleWrongTypeMessage = lang == "vi"
                        ? $"Loại xe ({vehicle.VehicleType}) không khớp với yêu cầu ({activity.RequestedVehicleType})."
                        : $"Vehicle type ({vehicle.VehicleType}) does not match requested ({activity.RequestedVehicleType}).";
                    return Error.Validation(TourInstanceTransportErrors.VehicleWrongTypeCode, vehicleWrongTypeMessage);
                }

                vehicleEntities.Add((vehicle.Id, vehicle));
                loadedVehicleIds.Add(row.VehicleId);
            }

            if (row.DriverId == Guid.Empty)
                return Error.Validation(ErrorConstants.Driver.RequiredCode, ErrorConstants.Driver.RequiredDescription.Resolve(lang));

            var driver = await driverRepository.GetByIdAsync(row.DriverId, cancellationToken);
            if (driver is null)
                return Error.Validation(ErrorConstants.Driver.NotOwnedCode, ErrorConstants.Driver.NotOwnedDescription.Resolve(lang));

            bool driverBelongsToSupplier = driver.SupplierId.HasValue
                ? driver.SupplierId == activity.TransportSupplierId
                : driver.UserId == currentUserId;

            if (!driverBelongsToSupplier)
                return Error.Validation(
                    TourInstanceTransportErrors.VehicleWrongSupplierCode,
                    TourInstanceTransportErrors.VehicleWrongSupplierDescription.Resolve(lang)); // Reusing vehicle supplier error code is legacy, but message now generic

            if (!driver.IsActive)
                return Error.Validation(ErrorConstants.Driver.InactiveCode, ErrorConstants.Driver.InactiveDescription.Resolve(lang));
        }

        // For seat capacity: when manager-driven, each row represents a physical vehicle instance,
        // so multiply distinct vehicle capacity by the number of rows using it.
        var totalSeatCapacity = normalized.Sum(r => vehicleEntities.First(v => v.Id == r.VehicleId).Entity.SeatCapacity);
        if (!TourInstanceTransportAssignmentRules.SeatCapacityCoversRequest(totalSeatCapacity, requiredSeats))
        {
            if (normalized.Count == 1)
            {
                var vehicleInsufficientMessage = lang == "vi"
                    ? $"Sức chứa của xe ({totalSeatCapacity}) không đủ cho số ghế yêu cầu ({requiredSeats})."
                    : $"Vehicle capacity ({totalSeatCapacity}) is insufficient for requested seats ({requiredSeats}).";
                return Error.Validation(TourInstanceTransportErrors.VehicleInsufficientCapacityCode, vehicleInsufficientMessage);
            }

            return Error.Validation(
                TourInstanceTransportErrors.TransportFleetInsufficientCapacityCode,
                TourInstanceTransportErrors.TransportFleetInsufficientCapacityDescription.Resolve(lang));
        }

        var activityDate = activity.TourInstanceDay.ActualDate;
        // Deduplicate checks: in manager-driven mode, multiple rows share the same vehicleId
        var uniqueVehicleIds = normalized.Select(r => r.VehicleId).Distinct().ToList();
        foreach (var vid in uniqueVehicleIds)
        {
            var availabilityCheck = await availabilityService.CheckVehicleAvailabilityAsync(
                vid, activityDate, request.ActivityId, cancellationToken);

            if (availabilityCheck.IsError) return availabilityCheck.Errors;
            if (!availabilityCheck.Value)
                return Error.Validation(
                    TourInstanceTransportErrors.VehicleUnavailableCode,
                    TourInstanceTransportErrors.VehicleUnavailableDescription.Resolve(lang));
        }

        foreach (var row in normalized)
        {
            var driverCheck = await availabilityService.CheckDriverAvailabilityAsync(
                row.DriverId, activityDate, request.ActivityId, cancellationToken);
            if (driverCheck.IsError) return driverCheck.Errors;
            if (!driverCheck.Value)
                return Error.Validation(
                    ErrorConstants.Vehicle.UnavailableCode, // Re-use conflict error code
                    lang == "vi" ? "Tài xế hiện đang được phân công cho một hoạt động khác vào ngày này." : "Driver is currently assigned to another activity on this date.");
        }

        const int maxAttempts = 3;
        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                logger.LogWarning("[APPROVE-DIAG] Entering transaction attempt {Attempt} for activity {Id}", attempt, request.ActivityId);
                await unitOfWork.ExecuteTransactionAsync(IsolationLevel.RepeatableRead, async () =>
                {
                    // Deduplicate: check each unique vehicleId only once
                    foreach (var vid in uniqueVehicleIds)
                    {
                        var txCheck = await availabilityService.CheckVehicleAvailabilityAsync(
                            vid, activityDate, request.ActivityId, cancellationToken);
                        if (txCheck.IsError || !txCheck.Value)
                        {
                            throw new TransportApproveConflictException(
                                TourInstanceTransportErrors.VehicleUnavailableCode,
                                TourInstanceTransportErrors.VehicleUnavailableDescription.Resolve(lang));
                        }
                    }

                    foreach (var row in normalized)
                    {
                        var txDriverCheck = await availabilityService.CheckDriverAvailabilityAsync(
                            row.DriverId, activityDate, request.ActivityId, cancellationToken);
                        if (txDriverCheck.IsError || !txDriverCheck.Value)
                        {
                            throw new TransportApproveConflictException(
                                ErrorConstants.Vehicle.UnavailableCode,
                                lang == "vi" ? "Tài xế hiện đang được phân công cho một hoạt động khác vào ngày này." : "Driver is currently assigned to another activity on this date.");
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
                    logger.LogWarning("[APPROVE-DIAG] Added {Count} assignments to activity.TransportAssignments", activity.TransportAssignments.Count);
                    var primary = normalized[0];
                    activity.ApproveTransportation(primary.VehicleId, primary.DriverId, request.Note);
                    logger.LogWarning("[APPROVE-DIAG] After ApproveTransportation: Status={Status}, VehicleId={V}, DriverId={D}",
                        activity.TransportationApprovalStatus, activity.VehicleId, activity.DriverId);

                    // Create one VehicleBlock per unique vehicleId (unique index prevents duplicates)
                    foreach (var vid in uniqueVehicleIds)
                    {
                        var block = VehicleBlockEntity.Create(
                            vid,
                            activityDate,
                            performedBy,
                            tourInstanceDayActivityId: request.ActivityId,
                            holdStatus: HoldStatus.Hard);

                        await vehicleBlockRepository.AddAsync(block, cancellationToken);
                    }

                    instance.CheckAndActivateTourInstance();

                    // Do NOT call tourInstanceRepository.Update(instance) here!
                    // Update() calls _context.TourInstances.Update() which marks ALL reachable
                    // entities as Modified — but newly-added TransportAssignment entities must
                    // be Added, not Modified. Since the instance was loaded tracked (no AsNoTracking
                    // in FindByIdWithInstanceDaysForUpdate), EF's change tracker already detects
                    // all modifications. Just call SaveChangesAsync.
                    logger.LogWarning("[APPROVE-DIAG] Calling SaveChangeAsync...");
                    var saved = await unitOfWork.SaveChangeAsync(cancellationToken);
                    logger.LogWarning("[APPROVE-DIAG] SaveChangeAsync returned {Saved} rows affected", saved);
                });

                logger.LogWarning("[APPROVE-DIAG] Transaction committed, returning success");
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
                    TourInstanceTransportErrors.VehicleUnavailableDescription.Resolve(lang));
            }
            catch (DbUpdateException dbEx) when (IsPostgresSqlState(dbEx, "40001") && attempt < maxAttempts)
            {
                await Task.Delay(50 * attempt, cancellationToken);
                continue;
            }
            catch (DbUpdateException dbEx) when (IsPostgresSqlState(dbEx, "40001"))
            {
                return Error.Conflict(
                    ErrorConstants.Vehicle.UnavailableCode,
                    ErrorConstants.Vehicle.UnavailableDescription.Resolve(lang));
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
                    ErrorConstants.Vehicle.UnavailableCode,
                    ErrorConstants.Vehicle.UnavailableDescription.Resolve(lang));
            }
        }

        return Error.Failure(ErrorConstants.Vehicle.ExhaustedCode, ErrorConstants.Vehicle.ExhaustedDescription.Resolve(lang));
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
    public string Code { get; } = code;
}
