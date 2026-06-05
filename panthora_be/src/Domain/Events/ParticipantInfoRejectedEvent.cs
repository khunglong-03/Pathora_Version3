using Domain.Abstractions;

namespace Domain.Events;

public sealed record ParticipantInfoRejectedEvent(
    Guid ParticipantId,
    Guid BookingId,
    string ParticipantFullName,
    string RejectionReason,
    string? CustomerEmail,
    string CustomerName,
    string BookingCode
) : IDomainEvent;
