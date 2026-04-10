namespace Application.Contracts.Role;

public sealed record GetAllRoleRequest(
    int PageNumber = 1,
    int PageSize = 10,
    string? SearchText = null);

public sealed record RoleVm(
    int Id,
    string Name,
    string Description,
    int Status);
