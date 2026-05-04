namespace Domain.Events;

using Domain.Abstractions;

public sealed record BookingCancellationApprovedEvent(
    Guid BookingId,
    string PerformedBy
) : IDomainEvent;
