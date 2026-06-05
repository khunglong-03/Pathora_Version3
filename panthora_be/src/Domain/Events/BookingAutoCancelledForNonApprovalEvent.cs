namespace Domain.Events;

using Domain.Abstractions;
using Domain.Enums;

public sealed record BookingAutoCancelledForNonApprovalEvent(
    Guid BookingId,
    BookingStatus PreviousStatus,
    string ReasonCode,
    string PerformedBy) : IDomainEvent;
