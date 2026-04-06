namespace Domain.Events;

using Domain.Abstractions;
using Domain.Enums;

public sealed record BookingStatusChangedEvent(
    Guid BookingId,
    BookingStatus OldStatus,
    BookingStatus NewStatus,
    string PerformedBy
) : IDomainEvent;
