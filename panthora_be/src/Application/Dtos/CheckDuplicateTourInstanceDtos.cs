using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record CheckDuplicateTourInstanceResultDto(
    [property: JsonPropertyName("exists")] bool Exists,
    [property: JsonPropertyName("count")] int Count,
    [property: JsonPropertyName("existingInstances")] List<DuplicateInstanceSummaryDto> ExistingInstances);

public sealed record DuplicateInstanceSummaryDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("startDate")] DateTimeOffset StartDate,
    [property: JsonPropertyName("status")] string Status);
