namespace Application.Dtos;

public sealed record PositionDto(
    Guid Id,
    string Name,
    int Level,
    string? Note,
    int? Type,
    bool IsDeleted,
    string? CreatedBy,
    DateTimeOffset CreatedOnUtc,
    string? LastModifiedBy,
    DateTimeOffset? LastModifiedOnUtc
);
