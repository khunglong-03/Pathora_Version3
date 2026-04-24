using System.Text.Json.Serialization;

namespace Application.Contracts.Identity;

public record UserInfoVm(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("username")] string? Username,
    [property: JsonPropertyName("fullName")] string? FullName,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("avatar")] string? Avatar,
    [property: JsonPropertyName("forcePasswordChange")] bool ForcePasswordChange,
    [property: JsonPropertyName("roles")] IEnumerable<UserRoleVm> Roles,
    [property: JsonPropertyName("departments")] IEnumerable<UserDepartmentVm> Departments,
    [property: JsonPropertyName("portal")] string? Portal = null,
    [property: JsonPropertyName("defaultPath")] string? DefaultPath = null,
    [property: JsonPropertyName("phoneNumber")] string? PhoneNumber = null,
    [property: JsonPropertyName("address")] string? Address = null,
    [property: JsonPropertyName("preferredLanguage")] string? PreferredLanguage = null
);

public record UserRoleVm(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name);

public record UserDepartmentVm(
    [property: JsonPropertyName("id")] string Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("positionId")] Guid? PositionId,
    [property: JsonPropertyName("positionName")] string? PositionName
);

