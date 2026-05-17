using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

using Api.Hubs;
using Application.Services;

namespace Api.Services;

public record PaymentUpdateEvent(
    string TransactionCode,
    string NormalizedStatus,
    decimal? Amount,
    DateTimeOffset? PaidAt,
    Guid? BookingId,
    string? PaymentType,
    bool VerifiedWithProvider);

public interface IPaymentNotificationService
{
    Task BroadcastPaymentUpdateAsync(
        PaymentStatusSnapshot snapshot,
        CancellationToken ct = default);
    Task BroadcastBookingStatusChangedAsync(
        Guid bookingId,
        string newStatus,
        decimal paidAmount,
        decimal remainingBalance,
        Guid? userId,
        CancellationToken ct = default);
}

/// <summary>
/// Phase 4.2: Implements both Api-level service and Application-level broadcaster interface.
/// </summary>
public sealed class PaymentNotificationService(
    IHubContext<NotificationsHub> hubContext,
    Domain.Common.Repositories.IBookingRepository bookingRepository,
    ILogger<PaymentNotificationService> logger)
    : IPaymentNotificationService, IPaymentNotificationBroadcaster
{
    private readonly IHubContext<NotificationsHub> _hubContext = hubContext;
    private readonly Domain.Common.Repositories.IBookingRepository _bookingRepository = bookingRepository;
    private readonly ILogger<PaymentNotificationService> _logger = logger;

    public async Task BroadcastPaymentUpdateAsync(PaymentStatusSnapshot snapshot, CancellationToken ct = default)
    {
        await ((IPaymentNotificationBroadcaster)this).BroadcastAsync(snapshot, ct);
    }

    public async Task BroadcastBookingStatusChangedAsync(
        Guid bookingId,
        string newStatus,
        decimal paidAmount,
        decimal remainingBalance,
        Guid? userId,
        CancellationToken ct = default)
    {
        var payload = new
        {
            bookingId,
            newStatus,
            paidAmount,
            remainingBalance
        };

        if (userId.HasValue)
        {
            await _hubContext.Clients
                .Group($"user:{userId.Value.ToString()}")
                .SendAsync("BookingStatusChanged", payload, ct);
            _logger.LogDebug(
                "BookingStatusChanged broadcast to user {UserId} for booking {BookingId}",
                userId, bookingId);
        }

        await _hubContext.Clients
            .Group("admins")
            .SendAsync("BookingStatusChanged", payload, ct);
        _logger.LogDebug(
            "BookingStatusChanged broadcast to admins for booking {BookingId}",
            bookingId);
    }

    /// <inheritdoc />
    async Task IPaymentNotificationBroadcaster.BroadcastAsync(PaymentStatusSnapshot snapshot, CancellationToken ct)
    {
        PaymentUpdateEvent? paymentEvent = null;
        string? userId = null;
        Guid? bookingId = null;
        decimal paidAmount = 0m;
        decimal remainingBalance = 0m;

        try
        {
            var booking = await _bookingRepository.GetByPaymentTransactionCodeAsync(snapshot.TransactionCode);
            if (booking != null)
            {
                userId = booking.UserId.ToString();
                bookingId = booking.Id;

                var completedPaid = booking.PaymentTransactions
                    .Where(t => t.Status == Domain.Enums.TransactionStatus.Completed)
                    .Sum(t => t.PaidAmount ?? t.Amount);

                paidAmount = completedPaid;

                // Re-compute remaining balance from booking's stored total (approximate — authoritative value is in detail endpoint)
                remainingBalance = Math.Max(0m, booking.TotalPrice - completedPaid);

                paymentEvent = new PaymentUpdateEvent(
                    snapshot.TransactionCode,
                    snapshot.NormalizedStatus,
                    null,
                    snapshot.CheckedAt,
                    booking.Id,
                    null,
                    snapshot.VerifiedWithProvider);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not resolve userId for payment update {TransactionCode}", snapshot.TransactionCode);
        }

        if (paymentEvent == null)
        {
            paymentEvent = new PaymentUpdateEvent(
                snapshot.TransactionCode,
                snapshot.NormalizedStatus,
                null,
                snapshot.CheckedAt,
                null,
                null,
                snapshot.VerifiedWithProvider);
        }

        // Broadcast to the specific user
        if (!string.IsNullOrEmpty(userId))
        {
            await _hubContext.Clients
                .Group($"user:{userId}")
                .SendAsync("ReceivePaymentUpdate", paymentEvent, ct);
            _logger.LogDebug(
                "Payment update broadcast to user {UserId} for transaction {TransactionCode}",
                userId, snapshot.TransactionCode);
        }

        // Broadcast to all admins
        await _hubContext.Clients
            .Group("admins")
            .SendAsync("ReceivePaymentUpdate", paymentEvent, ct);
        _logger.LogDebug(
            "Payment update broadcast to admins for transaction {TransactionCode}",
            snapshot.TransactionCode);

        // Broadcast to anonymous transaction-scoped group (public/guest checkout)
        await _hubContext.Clients
            .Group($"tx:{snapshot.TransactionCode}")
            .SendAsync("ReceivePaymentUpdate", paymentEvent, ct);
        _logger.LogDebug(
            "Payment update broadcast to tx:{TransactionCode}",
            snapshot.TransactionCode);

        // Also emit BookingStatusChanged for clients listening to that event (task 4.4)
        if (bookingId.HasValue && !string.IsNullOrEmpty(userId))
        {
            var statusPayload = new
            {
                bookingId = bookingId.Value,
                newStatus = snapshot.NormalizedStatus,
                paidAmount,
                remainingBalance
            };
            await _hubContext.Clients
                .Group($"user:{userId}")
                .SendAsync("BookingStatusChanged", statusPayload, ct);
            await _hubContext.Clients
                .Group("admins")
                .SendAsync("BookingStatusChanged", statusPayload, ct);
            _logger.LogDebug(
                "BookingStatusChanged broadcast for booking {BookingId} status {NewStatus}",
                bookingId.Value, snapshot.NormalizedStatus);
        }
    }
}
