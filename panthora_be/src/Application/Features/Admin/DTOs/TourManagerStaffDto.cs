namespace Application.Features.Admin.DTOs;

public sealed record TourManagerStaffDto(
    UserSummaryDto Manager,
    List<StaffMemberDto> Staff
);

public sealed record UserSummaryDto(
    Guid Id,
    string FullName,
    string Email,
    string? AvatarUrl
);

public sealed record StaffMemberDto(
    Guid Id,
    string FullName,
    string Email,
    string? AvatarUrl,
    string Role,
    string RoleInTeam,
    string Status,
    List<StaffTourAssignmentDto> ActiveTours
);

public sealed record StaffTourAssignmentDto(
    Guid TourInstanceId,
    string TourName,
    string TourInstanceCode,
    DateTimeOffset StartDate,
    DateTimeOffset EndDate,
    string InstanceStatus,
    string RoleInInstance
);
