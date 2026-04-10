namespace Application.Dtos;

public sealed record RoleDto(
    int Id,
    string Name,
    string Description,
    int Type,
    int Status,
    bool IsDeleted,
    string? CreatedBy,
    DateTimeOffset CreatedOnUtc,
    string? LastModifiedBy,
    DateTimeOffset? LastModifiedOnUtc
);
