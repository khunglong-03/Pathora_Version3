using Application.Common.Constant;
using Application.Common.Interfaces;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using Microsoft.Extensions.Logging;
using System.Data;
using System.Text.Json.Serialization;

namespace Application.Features.BookingCancellation.Commands;

public sealed record RequestBookingCancellationCommand(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("reason")] string Reason)
    : ICommand<ErrorOr<RequestBookingCancellationResult>>;

public sealed record RequestBookingCancellationResult(
    Guid RequestId,
    string Type, // "DirectCancel" or "PendingManagerReview"
    decimal RefundAmount);

public sealed class RequestBookingCancellationCommandValidator
    : AbstractValidator<RequestBookingCancellationCommand>
{
    public RequestBookingCancellationCommandValidator()
    {
        RuleFor(x => x.BookingId).NotEmpty();
        RuleFor(x => x.Reason)
            .NotEmpty()
            .Must(s => !string.IsNullOrWhiteSpace(s))
            .WithMessage("Lý do không được để trống hoặc chỉ chứa khoảng trắng.")
            .MinimumLength(5)
            .WithMessage("Lý do phải có ít nhất 5 ký tự.")
            .MaximumLength(500)
            .WithMessage("Lý do không được vượt quá 500 ký tự.");
    }
}

public sealed class RequestBookingCancellationCommandHandler(
    IBookingRepository bookingRepository,
    IBookingCancellationRequestRepository cancellationRequestRepository,
    ICancellationPolicyRepository cancellationPolicyRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    ILogger<RequestBookingCancellationCommandHandler> logger)
    : ICommandHandler<RequestBookingCancellationCommand, ErrorOr<RequestBookingCancellationResult>>
{
    public async Task<ErrorOr<RequestBookingCancellationResult>> Handle(
        RequestBookingCancellationCommand request,
        CancellationToken cancellationToken)
    {
        var currentUserId = currentUser.Id;
        if (!currentUserId.HasValue)
            return Error.Unauthorized(BookingCancellationErrors.NotOwnerCode,
                BookingCancellationErrors.NotOwnerDescription.Vi);

        var performedBy = currentUserId.Value.ToString();
        RequestBookingCancellationResult? result = null;
        List<Error> errors = [];

        try
        {
            await unitOfWork.ExecuteTransactionAsync(IsolationLevel.RepeatableRead, async () =>
        {
            // Re-read booking inside transaction to avoid race
            var booking = await bookingRepository.GetByIdWithDetailsAsync(request.BookingId, cancellationToken);

            if (booking is null)
            {
                errors.Add(Error.NotFound(ErrorConstants.Booking.NotFoundCode,
                    ErrorConstants.Booking.NotFoundDescription.Vi));
                return;
            }

            // Ownership check
            if (booking.UserId != currentUserId.Value)
            {
                errors.Add(Error.Forbidden(BookingCancellationErrors.NotOwnerCode,
                    BookingCancellationErrors.NotOwnerDescription.Vi));
                return;
            }

            // Eligibility check: only Confirmed, Deposited, Paid, and Pending are eligible
            var eligibleStatuses = new[]
            {
                BookingStatus.Pending,
                BookingStatus.Confirmed,
                BookingStatus.Deposited,
                BookingStatus.Paid
            };
            if (!eligibleStatuses.Contains(booking.Status))
            {
                errors.Add(Error.Conflict(BookingCancellationErrors.BookingNotEligibleCode,
                    BookingCancellationErrors.BookingNotEligibleDescription.Vi));
                return;
            }

            // Days check
            var departure = booking.TourInstance?.StartDate ?? DateTimeOffset.MinValue;
            var daysBeforeDeparture = (int)(departure - DateTimeOffset.UtcNow).TotalDays;
            if (daysBeforeDeparture < 0)
            {
                errors.Add(Error.Conflict(BookingCancellationErrors.AlreadyDepartedCode,
                    BookingCancellationErrors.AlreadyDepartedDescription.Vi));
                return;
            }

            // Calculate paid amount inside tx
            var paidAmount = CalculatePaidAmount(booking);

            // Bypass manager for Pending + paidAmount == 0
            if (booking.Status == BookingStatus.Pending && paidAmount == 0)
            {
                booking.Cancel(request.Reason, performedBy);
                await bookingRepository.UpdateWithoutSaveAsync(booking);
                await unitOfWork.SaveChangeAsync(cancellationToken);
                result = new RequestBookingCancellationResult(Guid.Empty, "DirectCancel", 0);
                return;
            }

            // Check for existing pending request
            var existingPending = await cancellationRequestRepository
                .GetPendingByBookingId(booking.Id, cancellationToken);
            if (existingPending is not null)
            {
                errors.Add(Error.Conflict(
                    BookingCancellationErrors.AlreadyHasPendingRequestCode,
                    BookingCancellationErrors.AlreadyHasPendingRequestDescription.Vi));
                return;
            }

            // Policy lookup
            var tourScope = booking.TourInstance?.Tour?.TourScope ?? TourScope.Domestic;
            var policy = await cancellationPolicyRepository
                .FindActiveByTourScopeAsync(tourScope, cancellationToken: cancellationToken);

            int feePercent = 0;
            Guid? policyId = null;

            if (policy is null)
            {
                logger.LogWarning(
                    "No active cancellation policy for scope {Scope} on booking {BookingId}. Using 0% fee.",
                    tourScope, booking.Id);
            }
            else
            {
                policyId = policy.Id;
                var tier = policy.FindMatchingTier(daysBeforeDeparture);
                if (tier is not null)
                    feePercent = (int)tier.PenaltyPercentage;
            }

            var refundAmount = RoundVnd(paidAmount * (1 - feePercent / 100m));
            var previousStatus = booking.Status;

            // Transition booking to PendingCancellation
            booking.RequestCancellation(performedBy);
            await bookingRepository.UpdateWithoutSaveAsync(booking);

            // Create cancellation request entity
            var cancellationRequest = BookingCancellationRequestEntity.Create(
                bookingId: booking.Id,
                requestedByUserId: currentUserId.Value,
                cancellationPolicyId: policyId,
                tourScopeSnapshot: tourScope,
                daysBeforeDeparture: daysBeforeDeparture,
                feePercent: feePercent,
                paidAmountSnapshot: paidAmount,
                refundAmount: refundAmount,
                customerReason: request.Reason,
                previousBookingStatus: previousStatus,
                performedBy: performedBy);

            await cancellationRequestRepository.Add(cancellationRequest, cancellationToken);
            await unitOfWork.SaveChangeAsync(cancellationToken);

            result = new RequestBookingCancellationResult(
                cancellationRequest.Id,
                "PendingManagerReview",
                refundAmount);
        });
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException)
        {
            return Error.Conflict(
                BookingCancellationErrors.AlreadyHasPendingRequestCode,
                BookingCancellationErrors.AlreadyHasPendingRequestDescription.Vi);
        }

        if (errors.Count > 0)
            return errors;

        return result!;
    }

    private static decimal CalculatePaidAmount(BookingEntity booking)
    {
        var transactionSum = booking.PaymentTransactions?
            .Where(t => t.Status == Domain.Enums.TransactionStatus.Completed)
            .Sum(t => t.PaidAmount ?? t.Amount) ?? 0m;

        var depositSum = booking.Deposits?
            .Where(d => d.Status == DepositStatus.Paid)
            .Sum(d => d.ExpectedAmount) ?? 0m;

        var paymentSum = booking.Payments?.Sum(p => p.Amount) ?? 0m;

        return transactionSum + depositSum + paymentSum;
    }

    private static decimal RoundVnd(decimal value)
        => Math.Round(value, 0, MidpointRounding.AwayFromZero);
}
