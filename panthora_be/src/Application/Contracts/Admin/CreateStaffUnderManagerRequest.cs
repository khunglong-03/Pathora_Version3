namespace Application.Contracts.Admin;

public sealed record CreateStaffUnderManagerRequest(
    string Email,
    string FullName,
    int StaffType
);
