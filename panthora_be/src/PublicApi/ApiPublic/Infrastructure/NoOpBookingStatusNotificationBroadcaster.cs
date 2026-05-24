using Application.Services;

namespace ApiPublic.Infrastructure;

public sealed class NoOpBookingStatusNotificationBroadcaster : IBookingStatusNotificationBroadcaster
{
    public Task BroadcastAsync(Guid userId, BookingStatusNotificationPayload payload, CancellationToken ct = default)
    {
        return Task.CompletedTask;
    }
}
