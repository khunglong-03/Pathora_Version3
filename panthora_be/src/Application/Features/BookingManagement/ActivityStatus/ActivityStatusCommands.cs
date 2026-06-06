using Application.Common.Constant;
using Application.Common;
using Application.Contracts.Booking;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.BookingManagement.ActivityStatus;

public class ActivityStatusesPayload
{
    public List<Guid> Started { get; set; } = [];
    public List<Guid> Completed { get; set; } = [];
}

public sealed record InitializeActivityStatusCommand([property: JsonPropertyName("bookingId")] Guid BookingId) : ICommand<ErrorOr<int>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class InitializeActivityStatusCommandValidator : AbstractValidator<InitializeActivityStatusCommand>
{
    public InitializeActivityStatusCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
    }
}

public sealed class InitializeActivityStatusCommandHandler(
    IBookingRepository bookingRepository,
    ITourDayActivityStatusRepository tourDayActivityStatusRepository,
    IUnitOfWork unitOfWork,
    global::Contracts.Interfaces.IUser user,
    ILanguageContext? languageContext = null)
    : ICommandHandler<InitializeActivityStatusCommand, ErrorOr<int>>
{
    public async Task<ErrorOr<int>> Handle(InitializeActivityStatusCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var performedBy = user.Id ?? "system";
        var booking = await bookingRepository.GetByIdAsync(request.BookingId);
        if (booking is null)
        {
            return Error.NotFound(
                ErrorConstants.Booking.NotFoundCode,
                ErrorConstants.Booking.NotFoundDescription.Resolve(lang));
        }

        var tourDays = await unitOfWork
            .GenericRepository<TourDayEntity>()
            .GetListAsync(x => x.ClassificationId == booking.TourInstance.ClassificationId);

        if (tourDays.Count == 0)
        {
            return 0;
        }

        var existingStatuses = await tourDayActivityStatusRepository.GetByBookingIdAsync(request.BookingId);
        var existingTourDayIds = existingStatuses.Select(x => x.TourDayId).ToHashSet();

        var createdCount = 0;
        foreach (var tourDay in tourDays)
        {
            if (existingTourDayIds.Contains(tourDay.Id))
            {
                continue;
            }

            var status = TourDayActivityStatusEntity.Create(request.BookingId, tourDay.Id, performedBy);
            await tourDayActivityStatusRepository.AddAsync(status);
            createdCount++;
        }

        if (createdCount > 0)
        {
            await unitOfWork.SaveChangeAsync(cancellationToken);
        }

        return createdCount;
    }
}

public sealed record StartActivityCommand(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("tourDayId")] Guid TourDayId,
    [property: JsonPropertyName("actualStartTime")] DateTimeOffset? ActualStartTime,
    [property: JsonPropertyName("activityId")] Guid? ActivityId = null)
    : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class StartActivityCommandValidator : AbstractValidator<StartActivityCommand>
{
    public StartActivityCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.TourDayId).NotEmpty();
    }
}

public sealed class StartActivityCommandHandler(
    IBookingRepository bookingRepository,
    ITourDayActivityStatusRepository tourDayActivityStatusRepository,
    ITourInstanceRepository tourInstanceRepository,
    IOwnershipValidator ownershipValidator,
    IUser user,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<StartActivityCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(StartActivityCommand request, CancellationToken cancellationToken)
    {
        _ = languageContext;
        ErrorOr<Success> result = default;
        try
        {
            await unitOfWork.ExecuteTransactionAsync(System.Data.IsolationLevel.RepeatableRead, async () =>
            {
                var booking = await bookingRepository.GetByIdAsync(request.BookingId);
                if (booking is null)
                {
                    result = Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
                    return;
                }

                // Check access: either owner/admin OR guide assigned to the tour instance
                var hasAccess = await ownershipValidator.CanAccessAsync(booking.UserId ?? Guid.Empty, cancellationToken);
                if (!hasAccess)
                {
                    if (Guid.TryParse(user.Id, out var currentUserId))
                    {
                        var isAssignedGuide = await tourInstanceRepository.HasGuideAssignmentAsync(booking.TourInstanceId, currentUserId, cancellationToken);
                        if (!isAssignedGuide)
                        {
                            result = Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
                            return;
                        }
                    }
                    else
                    {
                        result = Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
                        return;
                    }
                }

                var performedBy = user.Id ?? "system";
                var status = await tourDayActivityStatusRepository.GetByBookingIdAndTourDayIdAsync(request.BookingId, request.TourDayId);
                bool isNew = false;
                if (status is null)
                {
                    status = TourDayActivityStatusEntity.Create(
                        bookingId: request.BookingId,
                        tourDayId: request.TourDayId,
                        performedBy: performedBy);
                    await tourDayActivityStatusRepository.AddAsync(status);
                    isNew = true;
                }

                // Serialize per-activity status
                ActivityStatusesPayload payload;
                try
                {
                    payload = System.Text.Json.JsonSerializer.Deserialize<ActivityStatusesPayload>(status.Note ?? "") ?? new();
                }
                catch
                {
                    payload = new();
                }

                if (request.ActivityId.HasValue)
                {
                    var actId = request.ActivityId.Value;
                    if (!payload.Started.Contains(actId))
                    {
                        payload.Started.Add(actId);
                    }
                }
                else
                {
                    // Fallback to day-level start
                    var tourInstanceForDays = await tourInstanceRepository.FindByIdWithInstanceDays(booking.TourInstanceId, cancellationToken);
                    var targetDayForDays = tourInstanceForDays?.InstanceDays.FirstOrDefault(d => d.TourDayId == request.TourDayId);
                    var requiredActivityIds = targetDayForDays?.Activities.Select(a => a.Id).ToList() ?? [];
                    payload.Started = requiredActivityIds;
                }

                status.Note = System.Text.Json.JsonSerializer.Serialize(payload);

                if (status.ActivityStatus == Domain.Enums.ActivityStatus.NotStarted)
                {
                    try
                    {
                        status.Start(performedBy, request.ActualStartTime);
                    }
                    catch (InvalidOperationException ex)
                    {
                        result = Error.Validation("ActivityStatus.InvalidTransition", ex.Message);
                        return;
                    }
                }

                if (!isNew)
                {
                    tourDayActivityStatusRepository.Update(status);
                }

                // Auto Confirmed -> InProgress
                var tourInstance = await tourInstanceRepository.FindById(booking.TourInstanceId, cancellationToken: cancellationToken);
                if (tourInstance != null && tourInstance.Status == TourInstanceStatus.Confirmed)
                {
                    try
                    {
                        tourInstance.ChangeStatus(TourInstanceStatus.InProgress, performedBy);
                    }
                    catch (InvalidOperationException ex)
                    {
                        result = Error.Validation("ActivityStatus.InvalidTourTransition", ex.Message);
                        return;
                    }
                    await tourInstanceRepository.Update(tourInstance, cancellationToken);
                }

                await unitOfWork.SaveChangeAsync(cancellationToken);
                result = Result.Success;
            });
        }
        catch (Exception)
        {
            throw;
        }

        return result;
    }
}

public sealed record CompleteActivityCommand(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("tourDayId")] Guid TourDayId,
    [property: JsonPropertyName("actualEndTime")] DateTimeOffset? ActualEndTime,
    [property: JsonPropertyName("activityId")] Guid? ActivityId = null)
    : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class CompleteActivityCommandValidator : AbstractValidator<CompleteActivityCommand>
{
    public CompleteActivityCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.TourDayId).NotEmpty();
    }
}

public sealed class CompleteActivityCommandHandler(
    IBookingRepository bookingRepository,
    ITourDayActivityStatusRepository tourDayActivityStatusRepository,
    ITourInstanceRepository tourInstanceRepository,
    IOwnershipValidator ownershipValidator,
    IUser user,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<CompleteActivityCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(CompleteActivityCommand request, CancellationToken cancellationToken)
    {
        _ = languageContext;
        ErrorOr<Success> result = default;
        try
        {
            await unitOfWork.ExecuteTransactionAsync(System.Data.IsolationLevel.RepeatableRead, async () =>
            {
                var booking = await bookingRepository.GetByIdAsync(request.BookingId);
                if (booking is null)
                {
                    result = Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
                    return;
                }

                // Check access: either owner/admin OR guide assigned to the tour instance
                var hasAccess = await ownershipValidator.CanAccessAsync(booking.UserId ?? Guid.Empty, cancellationToken);
                if (!hasAccess)
                {
                    if (Guid.TryParse(user.Id, out var currentUserId))
                    {
                        var isAssignedGuide = await tourInstanceRepository.HasGuideAssignmentAsync(booking.TourInstanceId, currentUserId, cancellationToken);
                        if (!isAssignedGuide)
                        {
                            result = Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
                            return;
                        }
                    }
                    else
                    {
                        result = Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
                        return;
                    }
                }

                var performedBy = user.Id ?? "system";
                var status = await tourDayActivityStatusRepository.GetByBookingIdAndTourDayIdAsync(request.BookingId, request.TourDayId);
                bool isNew = false;
                if (status is null)
                {
                    status = TourDayActivityStatusEntity.Create(
                        bookingId: request.BookingId,
                        tourDayId: request.TourDayId,
                        performedBy: performedBy);
                    await tourDayActivityStatusRepository.AddAsync(status);
                    isNew = true;
                }

                // Serialize per-activity status
                ActivityStatusesPayload payload;
                try
                {
                    payload = System.Text.Json.JsonSerializer.Deserialize<ActivityStatusesPayload>(status.Note ?? "") ?? new();
                }
                catch
                {
                    payload = new();
                }

                var tourInstance = await tourInstanceRepository.FindByIdWithInstanceDaysForUpdate(booking.TourInstanceId, cancellationToken);
                var targetDay = tourInstance?.InstanceDays.FirstOrDefault(d => d.TourDayId == request.TourDayId);
                var requiredActivityIds = targetDay?.Activities.Where(a => !a.IsOptional).Select(a => a.Id).ToList() ?? [];

                if (request.ActivityId.HasValue)
                {
                    var actId = request.ActivityId.Value;
                    if (!payload.Started.Contains(actId)) payload.Started.Add(actId);
                    if (!payload.Completed.Contains(actId)) payload.Completed.Add(actId);
                }
                else
                {
                    // Fallback to day-level complete
                    payload.Started = requiredActivityIds;
                    payload.Completed = requiredActivityIds;
                }

                status.Note = System.Text.Json.JsonSerializer.Serialize(payload);

                if (status.ActivityStatus == Domain.Enums.ActivityStatus.NotStarted)
                {
                    status.Start(performedBy, request.ActualEndTime); // fast-forward
                }

                bool allDayActivitiesCompleted = requiredActivityIds.Count == 0 || 
                    requiredActivityIds.All(actId => payload.Completed.Contains(actId));

                if (allDayActivitiesCompleted)
                {
                    try
                    {
                        status.Complete(performedBy, request.ActualEndTime);
                    }
                    catch (InvalidOperationException ex)
                    {
                        result = Error.Validation("ActivityStatus.InvalidTransition", ex.Message);
                        return;
                    }
                }

                if (!isNew)
                {
                    tourDayActivityStatusRepository.Update(status);
                }

                // Auto InProgress -> Completed
                if (allDayActivitiesCompleted && tourInstance != null && tourInstance.Status == TourInstanceStatus.InProgress)
                {
                    var allBookings = await bookingRepository.GetByTourInstanceIdAsync(booking.TourInstanceId, cancellationToken);
                    var activeBookings = allBookings.Where(b => b.Status != BookingStatus.Cancelled).ToList();

                    var requiredTourDayIds = tourInstance.InstanceDays
                        .Where(d => d.TourDayId.HasValue)
                        .Select(d => d.TourDayId.GetValueOrDefault())
                        .Distinct().ToList();

                    if (activeBookings.Count > 0 && requiredTourDayIds.Count > 0)
                    {
                        var allBookingIds = activeBookings.Select(b => b.Id).ToList();
                        var allStatuses = await tourDayActivityStatusRepository.GetByBookingIdsAsync(allBookingIds, cancellationToken) ?? new List<TourDayActivityStatusEntity>();

                        // Replace/insert the in-memory status for the current booking and day to avoid stale database read (AsNoTracking)
                        var existingIndex = allStatuses.FindIndex(x => x.BookingId == booking.Id && x.TourDayId == request.TourDayId);
                        if (existingIndex >= 0)
                        {
                            allStatuses[existingIndex] = status;
                        }
                        else
                        {
                            allStatuses.Add(status);
                        }

                        bool allDone = activeBookings.All(b =>
                            requiredTourDayIds.All(tdId =>
                            {
                                var s = allStatuses.FirstOrDefault(x => x.BookingId == b.Id && x.TourDayId == tdId);
                                return s != null && (s.ActivityStatus == Domain.Enums.ActivityStatus.Completed || s.ActivityStatus == Domain.Enums.ActivityStatus.Cancelled);
                            }));

                        if (allDone)
                        {
                            try
                            {
                                tourInstance.ChangeStatus(TourInstanceStatus.Completed, performedBy);
                            }
                            catch (InvalidOperationException ex)
                            {
                                result = Error.Validation("ActivityStatus.InvalidTourEnd", ex.Message);
                                return;
                            }
                            await tourInstanceRepository.Update(tourInstance, cancellationToken);
                        }
                    }
                }

                result = Result.Success;
            });
        }
        catch (Exception)
        {
            throw;
        }

        return result;
    }
}

public sealed record CancelActivityCommand(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("tourDayId")] Guid TourDayId,
    [property: JsonPropertyName("reason")] string Reason)
    : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class CancelActivityCommandValidator : AbstractValidator<CancelActivityCommand>
{
    public CancelActivityCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.TourDayId).NotEmpty();
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(2000);
    }
}

public sealed class CancelActivityCommandHandler(
    IBookingRepository bookingRepository,
    ITourDayActivityStatusRepository tourDayActivityStatusRepository,
    ITourInstanceRepository tourInstanceRepository,
    IOwnershipValidator ownershipValidator,
    IUser user,
    IUnitOfWork unitOfWork,
    ILanguageContext? languageContext = null)
    : ICommandHandler<CancelActivityCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(CancelActivityCommand request, CancellationToken cancellationToken)
    {
        var booking = await bookingRepository.GetByIdAsync(request.BookingId);
        if (booking is null)
        {
            return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
        }

        // Check access: either owner/admin OR guide assigned to the tour instance
        var hasAccess = await ownershipValidator.CanAccessAsync(booking.UserId ?? Guid.Empty, cancellationToken);
        if (!hasAccess)
        {
            if (Guid.TryParse(user.Id, out var currentUserId))
            {
                var isAssignedGuide = await tourInstanceRepository.HasGuideAssignmentAsync(booking.TourInstanceId, currentUserId, cancellationToken);
                if (!isAssignedGuide)
                {
                    return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
                }
            }
            else
            {
                return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
            }
        }

        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var reason = string.IsNullOrWhiteSpace(request.Reason)
            ? ErrorConstants.ActivityStatus.DefaultCancelReason.Resolve(lang)
            : request.Reason;

        var status = await tourDayActivityStatusRepository.GetByBookingIdAndTourDayIdAsync(request.BookingId, request.TourDayId);
        if (status is null)
        {
            return Error.NotFound(
                ErrorConstants.ActivityStatus.NotFoundCode,
                ErrorConstants.ActivityStatus.NotFoundDescription.Resolve(lang));
        }

        try
        {
            var performedBy = user.Id ?? "system";
            status.Cancel(reason, performedBy);
        }
        catch (InvalidOperationException ex)
        {
            return Error.Validation("ActivityStatus.InvalidTransition", ex.Message);
        }

        tourDayActivityStatusRepository.Update(status);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return Result.Success;
    }
}

public sealed record GetActivityStatusesQuery([property: JsonPropertyName("bookingId")] Guid BookingId) : IQuery<ErrorOr<List<TourDayActivityStatusDto>>>;

public sealed class GetActivityStatusesQueryHandler(
    IBookingRepository bookingRepository,
    ITourDayActivityStatusRepository tourDayActivityStatusRepository,
    ITourDayActivityGuideRepository tourDayActivityGuideRepository)
    : IQueryHandler<GetActivityStatusesQuery, ErrorOr<List<TourDayActivityStatusDto>>>
{
    public async Task<ErrorOr<List<TourDayActivityStatusDto>>> Handle(GetActivityStatusesQuery request, CancellationToken cancellationToken)
    {
        var booking = await bookingRepository.GetByIdAsync(request.BookingId);
        if (booking is null)
        {
            return Error.NotFound("Booking.IsNull", "Booking is null.");
        }

        var statuses = await tourDayActivityStatusRepository.GetByBookingIdAsync(request.BookingId);
        var result = new List<TourDayActivityStatusDto>();

        foreach (var status in statuses)
        {
            var guides = await tourDayActivityGuideRepository.GetByActivityStatusIdAsync(status.Id);
            
            List<Guid> startedActivityIds = new();
            List<Guid> completedActivityIds = new();
            if (!string.IsNullOrEmpty(status.Note))
            {
                try
                {
                    var payload = System.Text.Json.JsonSerializer.Deserialize<ActivityStatusesPayload>(status.Note);
                    if (payload != null)
                    {
                        startedActivityIds = payload.Started ?? new();
                        completedActivityIds = payload.Completed ?? new();
                    }
                }
                catch
                {
                    // Ignore JSON parsing errors
                }
            }

            result.Add(new TourDayActivityStatusDto(
                status.Id,
                status.BookingId,
                status.TourDayId,
                status.ActivityStatus,
                status.ActualStartTime,
                status.ActualEndTime,
                status.CompletedAt,
                status.CancellationReason,
                status.CancelledAt,
                status.Note,
                guides.Select(g => new TourDayActivityGuideDto(
                    g.Id,
                    g.TourDayActivityStatusId,
                    g.UserId,
                    g.Role,
                    g.CheckInTime,
                    g.CheckOutTime,
                    g.Note)).ToList(),
                startedActivityIds,
                completedActivityIds));
        }

        return result;
    }
}

public sealed record GetActivityStatusByTourDayQuery(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("tourDayId")] Guid TourDayId) : IQuery<ErrorOr<TourDayActivityStatusDto>>;

public sealed class GetActivityStatusByTourDayQueryHandler(
    IBookingRepository bookingRepository,
    ITourDayActivityStatusRepository tourDayActivityStatusRepository,
    ITourDayActivityGuideRepository tourDayActivityGuideRepository,
    IOwnershipValidator ownershipValidator,
    ITourInstanceRepository tourInstanceRepository,
    IUser user,
    ILanguageContext? languageContext = null)
    : IQueryHandler<GetActivityStatusByTourDayQuery, ErrorOr<TourDayActivityStatusDto>>
{
    public async Task<ErrorOr<TourDayActivityStatusDto>> Handle(GetActivityStatusByTourDayQuery request, CancellationToken cancellationToken)
    {
        var booking = await bookingRepository.GetByIdAsync(request.BookingId);
        if (booking is null)
        {
            return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
        }

        // Check access: either owner/admin OR guide assigned to the tour instance
        var hasAccess = await ownershipValidator.CanAccessAsync(booking.UserId ?? Guid.Empty, cancellationToken);
        if (!hasAccess)
        {
            if (Guid.TryParse(user.Id, out var currentUserId))
            {
                var isAssignedGuide = await tourInstanceRepository.HasGuideAssignmentAsync(booking.TourInstanceId, currentUserId, cancellationToken);
                if (!isAssignedGuide)
                {
                    return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
                }
            }
            else
            {
                return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription);
            }
        }

        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var status = await tourDayActivityStatusRepository.GetByBookingIdAndTourDayIdAsync(request.BookingId, request.TourDayId);
        if (status is null)
        {
            return Error.NotFound(
                ErrorConstants.ActivityStatus.NotFoundCode,
                ErrorConstants.ActivityStatus.NotFoundDescription.Resolve(lang));
        }

        var guides = await tourDayActivityGuideRepository.GetByActivityStatusIdAsync(status.Id);

        List<Guid> startedActivityIds = new();
        List<Guid> completedActivityIds = new();
        if (!string.IsNullOrEmpty(status.Note))
        {
            try
            {
                var payload = System.Text.Json.JsonSerializer.Deserialize<ActivityStatusesPayload>(status.Note);
                if (payload != null)
                {
                    startedActivityIds = payload.Started ?? new();
                    completedActivityIds = payload.Completed ?? new();
                }
            }
            catch
            {
                // Ignore JSON parsing errors
            }
        }

        return new TourDayActivityStatusDto(
            status.Id,
            status.BookingId,
            status.TourDayId,
            status.ActivityStatus,
            status.ActualStartTime,
            status.ActualEndTime,
            status.CompletedAt,
            status.CancellationReason,
            status.CancelledAt,
            status.Note,
            guides.Select(g => new TourDayActivityGuideDto(
                g.Id,
                g.TourDayActivityStatusId,
                g.UserId,
                g.Role,
                g.CheckInTime,
                g.CheckOutTime,
                g.Note)).ToList(),
            startedActivityIds,
            completedActivityIds);
    }
}

public sealed record AssignGuideToActivityCommand(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("tourDayId")] Guid TourDayId,
    [property: JsonPropertyName("userId")] Guid UserId,
    [property: JsonPropertyName("role")] GuideRole Role,
    [property: JsonPropertyName("checkInTime")] DateTimeOffset? CheckInTime,
    [property: JsonPropertyName("checkOutTime")] DateTimeOffset? CheckOutTime,
    [property: JsonPropertyName("note")] string? Note) : ICommand<ErrorOr<Guid>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Booking];
}

public sealed class AssignGuideToActivityCommandValidator : AbstractValidator<AssignGuideToActivityCommand>
{
    public AssignGuideToActivityCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.TourDayId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.CheckOutTime)
            .GreaterThanOrEqualTo(x => x.CheckInTime)
            .When(x => x.CheckInTime.HasValue && x.CheckOutTime.HasValue);
    }
}

public sealed class AssignGuideToActivityCommandHandler(
    ITourDayActivityStatusRepository tourDayActivityStatusRepository,
    ITourDayActivityGuideRepository tourDayActivityGuideRepository,
    IUnitOfWork unitOfWork,
    global::Contracts.Interfaces.IUser user,
    ILanguageContext? languageContext = null)
    : ICommandHandler<AssignGuideToActivityCommand, ErrorOr<Guid>>
{
    public async Task<ErrorOr<Guid>> Handle(AssignGuideToActivityCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var performedBy = user.Id ?? "system";
        var status = await tourDayActivityStatusRepository.GetByBookingIdAndTourDayIdAsync(request.BookingId, request.TourDayId);
        if (status is null)
        {
            return Error.NotFound(
                ErrorConstants.ActivityStatus.NotFoundCode,
                ErrorConstants.ActivityStatus.NotFoundDescription.Resolve(lang));
        }

        if (status.ActivityStatus == Domain.Enums.ActivityStatus.Cancelled)
        {
            return Error.Validation(
                ErrorConstants.ActivityStatus.CancelledCode,
                ErrorConstants.ActivityStatus.CancelledDescription.Resolve(lang));
        }

        var entity = TourDayActivityGuideEntity.Create(
            status.Id,
            request.UserId,
            request.Role,
            performedBy: performedBy,
            request.CheckInTime,
            request.CheckOutTime,
            request.Note);

        await tourDayActivityGuideRepository.AddAsync(entity);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        return entity.Id;
    }
}
