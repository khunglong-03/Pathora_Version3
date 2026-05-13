namespace Domain.Events;

using Domain.Abstractions;
using Domain.Enums;

public sealed record VisaApplicationStatusChangedEvent(
    Guid VisaApplicationId,
    VisaStatus OldStatus,
    VisaStatus NewStatus,
    string PerformedBy
) : IDomainEvent;
