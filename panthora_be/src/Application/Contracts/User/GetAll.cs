namespace Application.Contracts.User;

public sealed record GetAllUserRequest(
    Guid DepartmentId,
    string? TextSearch,
    int PageNumber = 1,
    int PageSize = 10,
    string? RoleName = null);

public sealed record UserVm(
    Guid Id,
    string? Avatar,
    string Username,
    string? FullName,
    string Email,
    string DepartmentName,
    List<string> Roles,
    Dictionary<string, bool> ButtonShow
);

public sealed class UserDto
{
    public Guid Id { get; set; }
    public string? Avatar { get; set; } = null!;
    public string Username { get; set; } = null!;
    public string? FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string DepartmentName { get; set; } = null!;
}

