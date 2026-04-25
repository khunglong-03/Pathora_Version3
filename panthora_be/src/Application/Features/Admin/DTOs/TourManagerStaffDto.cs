using System.Text.Json.Serialization;

namespace Application.Features.Admin.DTOs;
public sealed record TourManagerStaffDto(
    [property: JsonPropertyName("manager")] UserSummaryDto Manager,
    [property: JsonPropertyName("staff")] List<StaffMemberDto> Staff);

public sealed record UserSummaryDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("avatarUrl")] string? AvatarUrl);

public sealed record StaffMemberDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("avatarUrl")] string? AvatarUrl,
    [property: JsonPropertyName("role")] string Role,
    [property: JsonPropertyName("roleInTeam")] string RoleInTeam,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("activeTours")] List<StaffTourAssignmentDto> ActiveTours);

public sealed record StaffTourAssignmentDto(
    [property: JsonPropertyName("tourInstanceId")] Guid TourInstanceId,
    [property: JsonPropertyName("tourName")] string TourName,
    [property: JsonPropertyName("tourInstanceCode")] string TourInstanceCode,
    [property: JsonPropertyName("startDate")] DateTimeOffset StartDate,
    [property: JsonPropertyName("endDate")] DateTimeOffset EndDate,
    [property: JsonPropertyName("instanceStatus")] string InstanceStatus,
    [property: JsonPropertyName("roleInInstance")] string RoleInInstance);
