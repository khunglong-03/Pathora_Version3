using System.Text.Json.Serialization;

namespace Application.Contracts.User;

public sealed record UserDetailVm(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("fullName")] string? FullName,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("avatar")] string? Avatar,
    [property: JsonPropertyName("roles")] IEnumerable<RoleVm> Roles,
    [property: JsonPropertyName("departments")] IEnumerable<UserDepartmentVm> Departments);

public sealed record RoleVm(
    [property: JsonPropertyName("roleId")] int RoleId,
    [property: JsonPropertyName("roleName")] string RoleName);

public sealed record UserDepartmentVm(
    [property: JsonPropertyName("departmentId")] Guid DepartmentId,
    [property: JsonPropertyName("departmentName")] string DepartmentName,
    [property: JsonPropertyName("positionId")] Guid? PositionId,
    [property: JsonPropertyName("positionName")] string? PositionName);

