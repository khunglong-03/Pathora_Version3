namespace Application.Contracts.User;

public sealed record UserDetailVm(
    Guid Id,
    string Username,
    string? FullName,
    string? Email,
    string? Avatar,
    IEnumerable<RoleVm> Roles,
    IEnumerable<UserDepartmentVm> Departments
);

public sealed record RoleVm(int RoleId, string RoleName);

public sealed record UserDepartmentVm(
    Guid DepartmentId,
    string DepartmentName,
    Guid? PositionId,
    string? PositionName);

