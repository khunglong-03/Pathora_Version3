using Application.Common.Constant;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Microsoft.Extensions.Logging;

namespace Application.Services.PrivateTour;

/// <summary>
/// Enforces <see cref="TourInstanceEntity.ConfirmationDeadline"/> for private tours stuck in
/// <see cref="TourInstanceStatus.PendingAdjustment"/> with unpaid top-up (task §6).
/// Does not apply cancellation fees — product/legal/accounting owns penalty rules.
/// </summary>
public sealed class PrivateTourTopUpDeadlineProcessor(
    ITourInstanceRepository tourInstanceRepository,
    IPrivateTourPolicyMetrics metrics,
    ILogger<PrivateTourTopUpDeadlineProcessor> logger)
{
    /// <returns>Number of tour instances that were cancelled after enforcing the policy.</returns>
    public async Task<int> ProcessExpiredConfirmationDeadlinesAsync(DateTimeOffset nowUtc, CancellationToken cancellationToken = default)
    {
        var list = await tourInstanceRepository.ListPrivateInstancesPendingTopUpPastDeadlineAsync(nowUtc, cancellationToken);
        if (list.Count == 0)
            return 0;

        var instancesUpdated = 0;
        var bookingsCancelled = 0;

        foreach (var instance in list)
        {
            var pendingTopUpBookings = instance.Bookings
                .Where(b => b.Status == BookingStatus.PendingAdjustment)
                .ToList();

            if (pendingTopUpBookings.Count == 0)
                continue;

            foreach (var booking in pendingTopUpBookings)
            {
                CloseStaleTopUpTransactions(booking);
                booking.Cancel(PrivateTourPolicyMessages.TopUpNotPaidByConfirmationDeadline, "SYSTEM");

                var remove = Math.Min(instance.CurrentParticipation, booking.TotalParticipants());
                if (remove > 0)
                    instance.RemoveParticipant(remove);

                bookingsCancelled++;
            }

            instance.ChangeStatus(TourInstanceStatus.Cancelled, "SYSTEM");
            await tourInstanceRepository.Update(instance, cancellationToken);
            instancesUpdated++;

            logger.LogWarning(
                "Private tour instance {InstanceId} cancelled: ConfirmationDeadline {Deadline} passed without top-up (bookings affected: {Count}).",
                instance.Id,
                instance.ConfirmationDeadline,
                pendingTopUpBookings.Count);
        }

        if (instancesUpdated > 0)
            metrics.RecordTopUpDeadlineForfeited(instancesUpdated, bookingsCancelled);

        return instancesUpdated;
    }

    private static void CloseStaleTopUpTransactions(BookingEntity booking)
    {
        foreach (var tx in booking.PaymentTransactions)
        {
            if (tx.Type != TransactionType.FullPayment)
                continue;
            if (tx.Status is not (TransactionStatus.Pending or TransactionStatus.Processing))
                continue;

            tx.MarkAsFailed(
                PrivateTourPolicyMessages.TopUpDeadlineErrorCode,
                PrivateTourPolicyMessages.TopUpTransactionClosedByDeadline);
        }
    }
}
