using System.Text.Json.Serialization;

namespace Contracts.ModelResponse;

public sealed record ActivityItemDto(
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("occurredAt")] DateTimeOffset OccurredAt
);
