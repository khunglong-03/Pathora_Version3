using System.Text.Json.Serialization;
using Application.Common;
using Application.Common.Constant;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.Events;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.BookingManagement.Participant;

// Task 4.1: Create ReviewParticipantInfoCommand
public sealed record ReviewParticipantInfoCommand(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("participantId")] Guid ParticipantId,
    [property: JsonPropertyName("isApproved")] bool IsApproved,
    [property: JsonPropertyName("rejectionReason")] string? RejectionReason
) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate =>
        [$"{CacheKey.Booking}:participants:{BookingId}", CacheKey.Booking];
}

// Task 4.2: Create ReviewParticipantInfoCommandValidator
public sealed class ReviewParticipantInfoCommandValidator : AbstractValidator<ReviewParticipantInfoCommand>
{
    public ReviewParticipantInfoCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.ParticipantId).NotEmpty();

        RuleFor(x => x.RejectionReason)
            .NotEmpty()
            .WithMessage(ErrorConstants.ParticipantInfoReview.RejectionReasonRequiredDescription.Vi)
            .MaximumLength(2000)
            .When(x => !x.IsApproved);
    }
}

// Task 4.3: Implement ReviewParticipantInfoCommandHandler
public sealed class ReviewParticipantInfoCommandHandler(
    IBookingRepository bookingRepository,
    IBookingParticipantRepository bookingParticipantRepository,
    IBookingTourGuideRepository bookingTourGuideRepository,
    ITourInstanceRepository tourInstanceRepository,
    ITourRepository tourRepository,
    IUnitOfWork unitOfWork,
    IUser currentUser,
    ILanguageContext? languageContext = null)
    : ICommandHandler<ReviewParticipantInfoCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ReviewParticipantInfoCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var performedBy = currentUser.Id ?? "system";

        if (!Guid.TryParse(currentUser.Id, out var currentUserId))
        {
            return Error.Unauthorized(
                ErrorConstants.User.UnauthorizedCode,
                ErrorConstants.User.UnauthorizedDescription.Resolve(lang));
        }

        ErrorOr<Success> result = default;

        try
        {
            await unitOfWork.ExecuteTransactionAsync(System.Data.IsolationLevel.RepeatableRead, async () =>
            {
                var booking = await bookingRepository.GetByIdAsync(request.BookingId);
                if (booking is null)
                {
                    result = Error.NotFound(
                        ErrorConstants.Booking.NotFoundCode,
                        ErrorConstants.Booking.NotFoundDescription.Resolve(lang));
                    return;
                }

                var participant = await bookingParticipantRepository.GetByIdAsync(request.ParticipantId);
                if (participant is null)
                {
                    result = Error.NotFound(
                        ErrorConstants.BookingParticipant.NotFoundCode,
                        ErrorConstants.BookingParticipant.NotFoundDescription.Resolve(lang));
                    return;
                }

                // Task 4.8: IDOR/oracle hardening
                if (participant.BookingId != request.BookingId)
                {
                    result = Error.NotFound(
                        ErrorConstants.BookingParticipant.NotFoundCode,
                        ErrorConstants.BookingParticipant.NotFoundDescription.Resolve(lang));
                    return;
                }

                // Task 4.3: Cancelled check
                if (participant.Status == ReservationStatus.Cancelled)
                {
                    result = Error.Conflict(
                        ErrorConstants.ParticipantInfoReview.ParticipantCancelledCode,
                        ErrorConstants.ParticipantInfoReview.ParticipantCancelledDescription.Resolve(lang));
                    return;
                }

                // Task 4.5: Booking status gate
                if (booking.Status == BookingStatus.Cancelled || booking.Status == BookingStatus.Completed)
                {
                    result = Error.Conflict(
                        ErrorConstants.ParticipantInfoReview.BookingNotReviewableCode,
                        ErrorConstants.ParticipantInfoReview.BookingNotReviewableDescription.Resolve(lang));
                    return;
                }

                // Log telemetry on review after payment if applicable
                if (booking.Status == BookingStatus.Paid)
                {
                    // Emit simulated telemetry
                    Console.WriteLine($"Telemetry: participant_review_after_payment for booking {booking.Id}");
                }

                // Task 4.3 IDOR: Resolve team TourOperator
                var assignments = await bookingTourGuideRepository.GetByBookingIdAsync(request.BookingId, cancellationToken);
                var isTourOperatorAssigned = assignments.Any(a =>
                    a.AssignedRole == AssignedRole.TourOperator &&
                    a.Status == AssignmentStatus.Confirmed &&
                    a.UserId == currentUserId);

                if (!isTourOperatorAssigned)
                {
                    var isAuthorizedForInstance = false;
                    var tourInstance = await tourInstanceRepository.FindById(booking.TourInstanceId, asNoTracking: true, cancellationToken);
                    if (tourInstance is not null)
                    {
                        if (tourInstance.Managers.Any(m => m.UserId == currentUserId))
                        {
                            isAuthorizedForInstance = true;
                        }
                        else
                        {
                            var tour = await tourRepository.FindById(tourInstance.TourId, asNoTracking: true, cancellationToken);
                            if (tour is not null && tour.TourOperatorId == currentUserId)
                            {
                                isAuthorizedForInstance = true;
                            }
                        }
                    }

                    if (!isAuthorizedForInstance)
                    {
                        result = Error.Forbidden(
                            ErrorConstants.ParticipantInfoReview.NotAssignedTourOperatorCode,
                            ErrorConstants.ParticipantInfoReview.NotAssignedTourOperatorDescription.Resolve(lang));
                        return;
                    }
                }

                var bookingCode = "PATH-" + booking.CreatedOnUtc.ToString("yyyy-MMdd-HHmm");
                participant.MarkInfoReviewed(
                    request.IsApproved,
                    request.RejectionReason,
                    currentUserId,
                    performedBy,
                    booking.CustomerEmail,
                    booking.CustomerName,
                    bookingCode);

                bookingParticipantRepository.Update(participant);
                await unitOfWork.SaveChangeAsync(cancellationToken);

                result = Result.Success;
            });
        }
        catch (DbUpdateConcurrencyException)
        {
            // Task 4.6: Reload and check idempotency
            var reloadParticipant = await bookingParticipantRepository.GetByIdAsync(request.ParticipantId);
            if (reloadParticipant is not null && reloadParticipant.BookingId == request.BookingId)
            {
                var expectedStatus = request.IsApproved ? ParticipantInfoReviewStatus.Approved : ParticipantInfoReviewStatus.Rejected;
                var expectedReason = request.IsApproved ? null : request.RejectionReason;

                if (reloadParticipant.InfoReviewStatus == expectedStatus &&
                    reloadParticipant.InfoRejectionReason == expectedReason)
                {
                    return Result.Success; // Idempotent success
                }

                // Task 4.7: Retry once if state is NotReviewed
                if (reloadParticipant.InfoReviewStatus == ParticipantInfoReviewStatus.NotReviewed)
                {
                    try
                    {
                        await unitOfWork.ExecuteTransactionAsync(System.Data.IsolationLevel.RepeatableRead, async () =>
                        {
                            var participant = await bookingParticipantRepository.GetByIdAsync(request.ParticipantId);
                            if (participant is not null && participant.BookingId == request.BookingId &&
                                participant.InfoReviewStatus == ParticipantInfoReviewStatus.NotReviewed &&
                                participant.Status != ReservationStatus.Cancelled)
                            {
                                participant.MarkInfoReviewed(request.IsApproved, request.RejectionReason, currentUserId, performedBy);
                                bookingParticipantRepository.Update(participant);
                                await unitOfWork.SaveChangeAsync(cancellationToken);
                                result = Result.Success;
                            }
                        });
                        return result;
                    }
                    catch (DbUpdateConcurrencyException)
                    {
                        // Fall through to 409
                    }
                }

                // Task 4.11: Return Conflict with currentReview body
                return Error.Conflict(
                    ErrorConstants.ParticipantInfoReview.ConcurrencyConflictCode,
                    ErrorConstants.ParticipantInfoReview.ConcurrencyConflictDescription.Resolve(lang));
            }

            return Error.Conflict(
                ErrorConstants.ParticipantInfoReview.ConcurrencyConflictCode,
                ErrorConstants.ParticipantInfoReview.ConcurrencyConflictDescription.Resolve(lang));
        }

        return result;
    }
}

// Task 4.12: Create BulkApproveParticipantInfoCommand
public sealed record BulkApproveParticipantInfoCommand(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("participantIds")] Guid[] ParticipantIds
) : ICommand<ErrorOr<List<BulkReviewItemResult>>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate =>
        [$"{CacheKey.Booking}:participants:{BookingId}", CacheKey.Booking];
}

public sealed record BulkReviewItemResult(
    [property: JsonPropertyName("participantId")] Guid ParticipantId,
    [property: JsonPropertyName("success")] bool Success,
    [property: JsonPropertyName("errorCode")] string? ErrorCode = null
);

public sealed class BulkApproveParticipantInfoCommandValidator : AbstractValidator<BulkApproveParticipantInfoCommand>
{
    public BulkApproveParticipantInfoCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.ParticipantIds).NotEmpty();
    }
}

// BulkApproveParticipantInfoCommandHandler
public sealed class BulkApproveParticipantInfoCommandHandler(
    IBookingRepository bookingRepository,
    IBookingParticipantRepository bookingParticipantRepository,
    IBookingTourGuideRepository bookingTourGuideRepository,
    ITourInstanceRepository tourInstanceRepository,
    ITourRepository tourRepository,
    IUnitOfWork unitOfWork,
    IUser currentUser,
    ILanguageContext? languageContext = null)
    : ICommandHandler<BulkApproveParticipantInfoCommand, ErrorOr<List<BulkReviewItemResult>>>
{
    public async Task<ErrorOr<List<BulkReviewItemResult>>> Handle(BulkApproveParticipantInfoCommand request, CancellationToken cancellationToken)
    {
        var lang = languageContext?.CurrentLanguage ?? ILanguageContext.DefaultLanguage;
        var performedBy = currentUser.Id ?? "system";

        if (!Guid.TryParse(currentUser.Id, out var currentUserId))
        {
            return Error.Unauthorized(
                ErrorConstants.User.UnauthorizedCode,
                ErrorConstants.User.UnauthorizedDescription.Resolve(lang));
        }

        var results = new List<BulkReviewItemResult>();

        // Load booking first
        var booking = await bookingRepository.GetByIdAsync(request.BookingId);
        if (booking is null)
        {
            return Error.NotFound(
                ErrorConstants.Booking.NotFoundCode,
                ErrorConstants.Booking.NotFoundDescription.Resolve(lang));
        }

        // Verify TourOperator is assigned
        var assignments = await bookingTourGuideRepository.GetByBookingIdAsync(request.BookingId, cancellationToken);
        var isTourOperatorAssigned = assignments.Any(a =>
            a.AssignedRole == AssignedRole.TourOperator &&
            a.Status == AssignmentStatus.Confirmed &&
            a.UserId == currentUserId);

        if (!isTourOperatorAssigned)
        {
            var isAuthorizedForInstance = false;
            var tourInstance = await tourInstanceRepository.FindById(booking.TourInstanceId, asNoTracking: true, cancellationToken);
            if (tourInstance is not null)
            {
                if (tourInstance.Managers.Any(m => m.UserId == currentUserId))
                {
                    isAuthorizedForInstance = true;
                }
                else
                {
                    var tour = await tourRepository.FindById(tourInstance.TourId, asNoTracking: true, cancellationToken);
                    if (tour is not null && tour.TourOperatorId == currentUserId)
                    {
                        isAuthorizedForInstance = true;
                    }
                }
            }

            if (!isAuthorizedForInstance)
            {
                return Error.Forbidden(
                    ErrorConstants.ParticipantInfoReview.NotAssignedTourOperatorCode,
                    ErrorConstants.ParticipantInfoReview.NotAssignedTourOperatorDescription.Resolve(lang));
            }
        }

        // Check booking status
        if (booking.Status == BookingStatus.Cancelled || booking.Status == BookingStatus.Completed)
        {
            return Error.Conflict(
                ErrorConstants.ParticipantInfoReview.BookingNotReviewableCode,
                ErrorConstants.ParticipantInfoReview.BookingNotReviewableDescription.Resolve(lang));
        }

        // Loop and review inside transaction
        try
        {
            await unitOfWork.ExecuteTransactionAsync(System.Data.IsolationLevel.RepeatableRead, async () =>
            {
                foreach (var participantId in request.ParticipantIds)
                {
                    var participant = await bookingParticipantRepository.GetByIdAsync(participantId);
                    if (participant is null || participant.BookingId != request.BookingId)
                    {
                        results.Add(new BulkReviewItemResult(participantId, false, ErrorConstants.BookingParticipant.NotFoundCode));
                        continue;
                    }

                    if (participant.Status == ReservationStatus.Cancelled)
                    {
                        results.Add(new BulkReviewItemResult(participantId, false, ErrorConstants.ParticipantInfoReview.ParticipantCancelledCode));
                        continue;
                    }

                    try
                    {
                        participant.MarkInfoReviewed(true, null, currentUserId, performedBy);
                        bookingParticipantRepository.Update(participant);
                        results.Add(new BulkReviewItemResult(participantId, true));
                    }
                    catch (Exception)
                    {
                        results.Add(new BulkReviewItemResult(participantId, false, "BulkApprove.Failed"));
                    }
                }

                await unitOfWork.SaveChangeAsync(cancellationToken);
            });
        }
        catch (DbUpdateConcurrencyException)
        {
            return Error.Conflict(
                ErrorConstants.ParticipantInfoReview.ConcurrencyConflictCode,
                ErrorConstants.ParticipantInfoReview.ConcurrencyConflictDescription.Resolve(lang));
        }

        return results;
    }
}
