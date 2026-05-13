namespace Domain.Events;

using Domain.Abstractions;
using Domain.Enums;

public sealed record BookingCancellationRequestedEvent(
    Guid BookingId,
    BookingStatus PreviousStatus,
    string PerformedBy
) : IDomainEvent;
