using Domain.Enums;

namespace Application.Services;

public sealed record BookingStatusNotificationPayload(
    Guid BookingId,
    BookingStatus NewStatus,
    decimal PaidAmount,
    decimal RemainingBalance,
    DateTimeOffset UpdatedAt);

public interface IBookingStatusNotificationBroadcaster
{
    Task BroadcastAsync(Guid userId, BookingStatusNotificationPayload payload, CancellationToken ct = default);
}
