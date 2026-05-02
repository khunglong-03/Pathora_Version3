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

    /// <inheritdoc />
    async Task IPaymentNotificationBroadcaster.BroadcastAsync(PaymentStatusSnapshot snapshot, CancellationToken ct)
    {
        PaymentUpdateEvent? paymentEvent = null;
        string? userId = null;

        try
        {
            var booking = await _bookingRepository.GetByPaymentTransactionCodeAsync(snapshot.TransactionCode);
            if (booking != null)
            {
                userId = booking.UserId.ToString();
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
    }
}
