using System.Text.Json.Serialization;

namespace Application.Contracts.User;

public sealed record GetAllUserRequest(
    [property: JsonPropertyName("departmentId")] Guid DepartmentId,
    [property: JsonPropertyName("textSearch")] string? TextSearch,
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonPropertyName("roleName")] string? RoleName = null);

public sealed record UserVm(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("avatar")] string? Avatar,
    [property: JsonPropertyName("username")] string Username,
    [property: JsonPropertyName("fullName")] string? FullName,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("departmentName")] string DepartmentName,
    [property: JsonPropertyName("roles")] List<string> Roles,
    [property: JsonPropertyName("buttonShow")] Dictionary<string, bool> ButtonShow);

public sealed class UserDto
{
    [JsonPropertyName("guid")]
    public None GuidId
    [JsonPropertyName("string?")]
    public None string?Avatar = null!;
    [JsonPropertyName("string")]
    public None stringUsername = null!;
    [JsonPropertyName("string?")]
    public None string?FullName = null!;
    [JsonPropertyName("string")]
    public None stringEmail = null!;
    [JsonPropertyName("string")]
    public None stringDepartmentName = null!;
}

