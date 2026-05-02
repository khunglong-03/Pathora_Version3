namespace Domain.Events;

using Domain.Abstractions;

public sealed record VisaServiceFeeQuotedEvent(
    Guid VisaApplicationId,
    decimal Fee,
    string PerformedBy
) : IDomainEvent;
