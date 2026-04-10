using Application.Dtos;

namespace Application.Contracts.Role;

public sealed record GetRoleDetailRequest(int RoleId);

public sealed record RoleDetailResponse(
    int Id,
    string Name,
    string Description,
    int Status,
    bool IsDeleted,
    string? CreatedBy,
    DateTimeOffset CreatedOnUtc,
    string? LastModifiedBy,
    DateTimeOffset? LastModifiedOnUtc
);
