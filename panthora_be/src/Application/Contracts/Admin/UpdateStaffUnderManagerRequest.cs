namespace Application.Contracts.Admin;

public sealed record UpdateStaffUnderManagerRequest(
    string Email,
    string FullName,
    int StaffType,
    string? Password
);
