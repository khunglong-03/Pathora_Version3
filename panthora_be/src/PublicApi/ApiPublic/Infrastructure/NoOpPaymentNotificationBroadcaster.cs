using Application.Services;

namespace ApiPublic.Infrastructure;

public class NoOpPaymentNotificationBroadcaster : IPaymentNotificationBroadcaster
{
    public Task BroadcastAsync(PaymentStatusSnapshot snapshot, CancellationToken ct = default)
    {
        return Task.CompletedTask;
    }
}
