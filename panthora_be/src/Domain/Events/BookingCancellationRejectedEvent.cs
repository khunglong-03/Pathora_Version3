namespace Domain.Events;

using Domain.Abstractions;
using Domain.Enums;

public sealed record BookingCancellationRejectedEvent(
    Guid BookingId,
    BookingStatus RestoredStatus,
    string PerformedBy
) : IDomainEvent;
