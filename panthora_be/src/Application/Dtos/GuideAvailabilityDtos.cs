using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record GuideAvailabilityResultDto(
    [property: JsonPropertyName("conflicts")] List<GuideConflictDto> Conflicts);

public sealed record GuideConflictDto(
    [property: JsonPropertyName("guideId")] Guid GuideId,
    [property: JsonPropertyName("conflictingInstances")] List<GuideConflictInstanceDto> ConflictingInstances);

public sealed record GuideConflictInstanceDto(
    [property: JsonPropertyName("instanceId")] Guid InstanceId,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("startDate")] DateTimeOffset StartDate,
    [property: JsonPropertyName("endDate")] DateTimeOffset EndDate,
    [property: JsonPropertyName("status")] string Status);
