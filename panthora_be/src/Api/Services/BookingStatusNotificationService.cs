using Application.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

using Api.Hubs;

namespace Api.Services;

public sealed class BookingStatusNotificationService(
    IHubContext<NotificationsHub> hubContext,
    ILogger<BookingStatusNotificationService> logger)
    : IBookingStatusNotificationBroadcaster
{
    private readonly IHubContext<NotificationsHub> _hubContext = hubContext;
    private readonly ILogger<BookingStatusNotificationService> _logger = logger;

    public async Task BroadcastAsync(Guid userId, BookingStatusNotificationPayload payload, CancellationToken ct = default)
    {
        var signalrPayload = new
        {
            bookingId = payload.BookingId,
            newStatus = payload.NewStatus.ToString(),
            paidAmount = payload.PaidAmount,
            remainingBalance = payload.RemainingBalance,
            updatedAt = payload.UpdatedAt
        };

        await _hubContext.Clients
            .Group($"user:{userId}")
            .SendAsync("BookingStatusChanged", signalrPayload, ct);

        await _hubContext.Clients
            .Group("admins")
            .SendAsync("BookingStatusChanged", signalrPayload, ct);

        _logger.LogDebug(
            "BookingStatusChanged broadcast to user {UserId} and admins for booking {BookingId}",
            userId,
            payload.BookingId);
    }
}
