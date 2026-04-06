using Domain.Enums;

namespace Application.Contracts.Role;

public sealed record GetRoleDetailRequest(int RoleId);

public sealed record RoleDetailVm(
    int Id,
    string Name,
    string Description,
    int Type,
    RoleStatus Status,
    List<FunctionCategoryInfoVm> FunctionCategories
);
