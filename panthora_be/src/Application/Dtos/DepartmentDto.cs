namespace Application.Dtos;

public sealed record DepartmentDto(
    Guid Id,
    Guid? ParentId,
    string Name,
    int Level,
    bool IsDeleted,
    string? CreatedBy,
    DateTimeOffset CreatedOnUtc,
    string? LastModifiedBy,
    DateTimeOffset? LastModifiedOnUtc
);
