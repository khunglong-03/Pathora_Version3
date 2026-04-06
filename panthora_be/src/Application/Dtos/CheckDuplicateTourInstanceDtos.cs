namespace Application.Dtos;

public sealed record CheckDuplicateTourInstanceResultDto(
    bool Exists,
    int Count,
    List<DuplicateInstanceSummaryDto> ExistingInstances);

public sealed record DuplicateInstanceSummaryDto(
    Guid Id,
    string Title,
    DateTimeOffset StartDate,
    string Status);
