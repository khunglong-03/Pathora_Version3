using Application.Common;
using Application.Common.Constant;
using Application.Contracts.Booking;
using Application.Services;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.BookingManagement.ActivityStatus;

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
    [property: JsonPropertyName("actualStartTime")] DateTimeOffset? ActualStartTime)
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

        var status = await tourDayActivityStatusRepository.GetByBookingIdAndTourDayIdAsync(request.BookingId, request.TourDayId);
        if (status is null)
        {
            var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
            return Error.NotFound(
                ErrorConstants.ActivityStatus.NotFoundCode,
                ErrorConstants.ActivityStatus.NotFoundDescription.Resolve(lang));
        }

        try
        {
            var performedBy = user.Id ?? "system";
            status.Start(performedBy, request.ActualStartTime);
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

public sealed record CompleteActivityCommand(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("tourDayId")] Guid TourDayId,
    [property: JsonPropertyName("actualEndTime")] DateTimeOffset? ActualEndTime)
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

        try
        {
            var performedBy = user.Id ?? "system";
            status.Complete(performedBy, request.ActualEndTime);
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

public sealed record GetActivityStatusesQuery([property: JsonPropertyName("bookingId")] Guid BookingId) : IQuery<ErrorOr<List<TourDayActivityStatusDto>>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Booking}:activity-statuses:{BookingId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetActivityStatusesQueryHandler(
    IBookingRepository bookingRepository,
    ITourDayActivityStatusRepository tourDayActivityStatusRepository,
    ITourDayActivityGuideRepository tourDayActivityGuideRepository,
    IOwnershipValidator ownershipValidator,
    ITourInstanceRepository tourInstanceRepository,
    IUser user)
    : IQueryHandler<GetActivityStatusesQuery, ErrorOr<List<TourDayActivityStatusDto>>>
{
    public async Task<ErrorOr<List<TourDayActivityStatusDto>>> Handle(GetActivityStatusesQuery request, CancellationToken cancellationToken)
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

        var statuses = await tourDayActivityStatusRepository.GetByBookingIdAsync(request.BookingId);
        var result = new List<TourDayActivityStatusDto>();

        foreach (var status in statuses)
        {
            var guides = await tourDayActivityGuideRepository.GetByActivityStatusIdAsync(status.Id);
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
                    g.Note)).ToList()));
        }

        return result;
    }
}

public sealed record GetActivityStatusByTourDayQuery(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("tourDayId")] Guid TourDayId) : IQuery<ErrorOr<TourDayActivityStatusDto>>, ICacheable
{
    public string CacheKey => $"{Application.Common.CacheKey.Booking}:activity-status:{BookingId}:{TourDayId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

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
                g.Note)).ToList());
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
