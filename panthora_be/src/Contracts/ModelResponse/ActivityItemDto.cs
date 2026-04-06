namespace Contracts.ModelResponse;

public sealed record ActivityItemDto(
    string Type,
    string Description,
    DateTimeOffset OccurredAt
);
