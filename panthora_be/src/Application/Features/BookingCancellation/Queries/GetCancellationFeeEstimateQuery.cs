using Application.Common.Constant;
using Application.Common.Interfaces;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using Microsoft.Extensions.Logging;

namespace Application.Features.BookingCancellation.Queries;

public sealed record GetCancellationFeeEstimateQuery(Guid BookingId)
    : IQuery<ErrorOr<CancellationFeeEstimateDto>>;

public sealed record CancellationFeeEstimateDto(
    Guid BookingId,
    int FeePercent,
    decimal RefundAmount,
    int DaysBeforeDeparture,
    decimal PaidAmount,
    Guid? PolicyId);

public sealed class GetCancellationFeeEstimateQueryHandler(
    IBookingRepository bookingRepository,
    ICancellationPolicyRepository cancellationPolicyRepository,
    ICurrentUser currentUser,
    ILogger<GetCancellationFeeEstimateQueryHandler> logger)
    : IQueryHandler<GetCancellationFeeEstimateQuery, ErrorOr<CancellationFeeEstimateDto>>
{
    public async Task<ErrorOr<CancellationFeeEstimateDto>> Handle(
        GetCancellationFeeEstimateQuery request,
        CancellationToken cancellationToken)
    {
        var booking = await bookingRepository.GetByIdWithDetailsAsync(request.BookingId, cancellationToken);
        if (booking is null)
            return Error.NotFound(ErrorConstants.Booking.NotFoundCode, ErrorConstants.Booking.NotFoundDescription.Vi);

        // Authorization: only the booking owner can see the estimate
        var currentUserId = currentUser.Id;
        if (!currentUser.IsInRole(RoleConstants.Admin) &&
            (!currentUserId.HasValue || currentUserId.Value != booking.UserId))
        {
            return Error.Forbidden(
                BookingCancellationErrors.NotOwnerCode,
                BookingCancellationErrors.NotOwnerDescription.Vi);
        }

        // Calculate days before departure
        var departure = booking.TourInstance?.StartDate ?? DateTimeOffset.MinValue;
        var daysBeforeDeparture = (int)(departure - DateTimeOffset.UtcNow).TotalDays;

        if (daysBeforeDeparture < 0)
            return Error.Conflict(
                BookingCancellationErrors.AlreadyDepartedCode,
                BookingCancellationErrors.AlreadyDepartedDescription.Vi);

        // Calculate paid amount from deposits (Paid) + payments (all)
        var paidAmount = CalculatePaidAmount(booking);

        // Look up active cancellation policy for tour scope
        var tourScope = booking.TourInstance?.Tour?.TourScope ?? TourScope.Domestic;
        var policy = await cancellationPolicyRepository.FindActiveByTourScopeAsync(tourScope, cancellationToken: cancellationToken);

        int feePercent = 0;
        Guid? policyId = null;

        if (policy is null)
        {
            logger.LogWarning(
                "No active cancellation policy found for TourScope {Scope} on booking {BookingId}. Defaulting to 0% fee.",
                tourScope, booking.Id);
        }
        else
        {
            policyId = policy.Id;
            var tier = policy.FindMatchingTier(daysBeforeDeparture);
            // tier == null means days > maxTier => fee = 0% (early cancellation)
            if (tier is not null)
                feePercent = (int)tier.PenaltyPercentage;
        }

        var refundAmount = RoundVnd(paidAmount * (1 - feePercent / 100m));

        return new CancellationFeeEstimateDto(
            booking.Id,
            feePercent,
            refundAmount,
            daysBeforeDeparture,
            paidAmount,
            policyId);
    }

    private static decimal CalculatePaidAmount(Domain.Entities.BookingEntity booking)
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
