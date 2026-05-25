using Application.Services;
using Domain.Common.Repositories;
using Domain.Enums;
using Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.BookingManagement.Notifications;

/// <summary>
/// Broadcasts booking cancellation status changes to the affected customer so open booking pages can refresh.
/// </summary>
public sealed class BookingStatusRealtimeNotificationHandler(
    IBookingRepository bookingRepository,
    IBookingStatusNotificationBroadcaster broadcaster,
    ILogger<BookingStatusRealtimeNotificationHandler> logger)
    : INotificationHandler<BookingStatusChangedEvent>
{
    public async Task Handle(BookingStatusChangedEvent notification, CancellationToken cancellationToken)
    {
        if (notification.NewStatus != BookingStatus.Cancelled)
            return;

        var booking = await bookingRepository.GetByIdWithDetailsAsync(notification.BookingId, cancellationToken);
        if (booking is null)
            return;

        if (!booking.UserId.HasValue)
        {
            logger.LogDebug("Skipping booking realtime status update for booking {BookingId} because it has no user", notification.BookingId);
            return;
        }

        if (Guid.TryParse(notification.PerformedBy, out var performedByUserId) && performedByUserId == booking.UserId.Value)
        {
            logger.LogDebug("Skipping customer-initiated booking realtime status update for booking {BookingId}", notification.BookingId);
            return;
        }

        try
        {
            var paidAmount = booking.PaymentTransactions
                .Where(t => t.Status == TransactionStatus.Completed && t.Type is TransactionType.Deposit or TransactionType.FullPayment)
                .Sum(t => t.PaidAmount ?? t.Amount);
            var refundAmount = booking.PaymentTransactions
                .Where(t => t.Status == TransactionStatus.Completed && t.Type == TransactionType.Refund)
                .Sum(t => t.PaidAmount ?? t.Amount);
            var netPaid = Math.Max(0m, paidAmount - refundAmount);
            var remainingBalance = Math.Max(0m, booking.TotalPrice - netPaid);

            var payload = new BookingStatusNotificationPayload(
                booking.Id,
                notification.NewStatus,
                netPaid,
                remainingBalance,
                booking.LastModifiedOnUtc ?? DateTimeOffset.UtcNow);

            await broadcaster.BroadcastAsync(booking.UserId.Value, payload, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to broadcast booking realtime status update for booking {BookingId}", notification.BookingId);
        }
    }
}
