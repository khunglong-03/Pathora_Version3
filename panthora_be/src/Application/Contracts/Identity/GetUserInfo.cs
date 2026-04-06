namespace Application.Contracts.Identity;

public record UserInfoVm(
    Guid Id,
    string? Username,
    string? FullName,
    string? Email,
    string? Avatar,
    bool ForcePasswordChange,
    IEnumerable<UserRoleVm> Roles,
    IEnumerable<UserDepartmentVm> Departments,
    string? Portal = null,
    string? DefaultPath = null,
    string? PhoneNumber = null,
    string? Address = null,
    string? PreferredLanguage = null
);

public record UserRoleVm(int Type, string Id, string Name);

public record UserDepartmentVm(
    string Id,
    string Name,
    Guid? PositionId,
    string? PositionName
);

