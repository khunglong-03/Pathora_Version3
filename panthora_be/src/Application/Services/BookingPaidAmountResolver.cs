using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public sealed class BookingPaidAmountResolver(
    IDepositPolicyRepository depositPolicyRepository,
    ILogger<BookingPaidAmountResolver> logger) : IBookingPaidAmountResolver
{
    private readonly IDepositPolicyRepository _depositPolicyRepository = depositPolicyRepository;
    private readonly ILogger<BookingPaidAmountResolver> _logger = logger;

    public async Task<decimal> ResolveAsync(BookingEntity booking, CancellationToken ct = default)
    {
        var transactionSum = booking.PaymentTransactions?
            .Where(t => t.Status == TransactionStatus.Completed)
            .Sum(t => t.PaidAmount ?? t.Amount) ?? 0m;

        var depositSum = booking.Deposits?
            .Where(d => d.Status == DepositStatus.Paid)
            .Sum(d => d.ExpectedAmount) ?? 0m;

        var paymentSum = booking.Payments?.Sum(p => p.Amount) ?? 0m;

        var sum = transactionSum + depositSum + paymentSum;

        if (sum > 0m)
        {
            return sum;
        }

        // sum == 0m: Fallback logic based on Booking.Status
        decimal fallbackAmount = 0m;
        bool fallbackApplied = false;

        switch (booking.Status)
        {
            case BookingStatus.Deposited:
                var tourScope = booking.TourInstance?.Tour?.TourScope ?? TourScope.Domestic;
                var policies = await _depositPolicyRepository.GetAllActiveAsync(ct);
                var activePolicy = policies.FirstOrDefault(p => p.TourScope == tourScope);

                if (activePolicy != null)
                {
                    fallbackAmount = activePolicy.DepositType == DepositType.Percentage
                        ? RoundVnd(booking.TotalPrice * activePolicy.DepositValue / 100m)
                        : activePolicy.DepositValue;
                }
                else
                {
                    _logger.LogWarning("No active deposit policy found for TourScope {Scope} on booking {BookingId}. Defaulting to 50% deposit fallback.",
                        tourScope, booking.Id);
                    fallbackAmount = RoundVnd(booking.TotalPrice * 0.5m);
                }
                fallbackApplied = true;
                break;

            case BookingStatus.Paid:
                fallbackAmount = booking.TotalPrice;
                fallbackApplied = true;
                break;

            case BookingStatus.Cancelled:
            case BookingStatus.Completed:
                _logger.LogWarning("Booking {BookingId} has Status={Status} but transaction sum is 0. No fallback applied for this status.",
                    booking.Id, booking.Status);
                break;

            default:
                // Pending, Confirmed, PendingAdjustment, PendingCancellation -> keep 0
                break;
        }

        if (fallbackApplied)
        {
            _logger.LogWarning(
                "Booking {BookingId} has Status={Status} but transactions sum is 0. " +
                "Falling back to {FallbackAmount} (TotalPrice={TotalPrice}, IsFullPay={IsFullPay}).",
                booking.Id, booking.Status, fallbackAmount, booking.TotalPrice, booking.IsFullPay);
        }

        return fallbackAmount;
    }

    public static decimal RoundVnd(decimal value)
        => Math.Round(value, 0, MidpointRounding.AwayFromZero);
}
