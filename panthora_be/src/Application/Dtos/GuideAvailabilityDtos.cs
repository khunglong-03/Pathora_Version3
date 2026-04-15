namespace Application.Dtos;

public sealed record GuideAvailabilityResultDto(
    List<GuideConflictDto> Conflicts);

public sealed record GuideConflictDto(
    Guid GuideId,
    List<GuideConflictInstanceDto> ConflictingInstances);

public sealed record GuideConflictInstanceDto(
    Guid InstanceId,
    string Title,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    string Status);
