using System.Text.Json.Serialization;

namespace Application.Contracts.TourManagerAssignment;

public sealed record AssignmentItemVm(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("userId")] Guid? UserId,
    [property: JsonPropertyName("userName")] string? UserName,
    [property: JsonPropertyName("userEmail")] string? UserEmail,
    [property: JsonPropertyName("tourId")] Guid? TourId,
    [property: JsonPropertyName("tourName")] string? TourName,
    [property: JsonPropertyName("entityType")] int EntityType,
    [property: JsonPropertyName("roleInTeam")] int? RoleInTeam,
    [property: JsonPropertyName("createdAt")] DateTimeOffset CreatedAt);

public sealed record TourManagerSummaryVm(
    [property: JsonPropertyName("managerId")] Guid ManagerId,
    [property: JsonPropertyName("managerName")] string ManagerName,
    [property: JsonPropertyName("managerEmail")] string ManagerEmail,
    [property: JsonPropertyName("designerCount")] int DesignerCount,
    [property: JsonPropertyName("guideCount")] int GuideCount,
    [property: JsonPropertyName("tourCount")] int TourCount);

public sealed record TourManagerAssignmentDetailVm(
    [property: JsonPropertyName("managerId")] Guid ManagerId,
    [property: JsonPropertyName("managerName")] string ManagerName,
    [property: JsonPropertyName("managerEmail")] string ManagerEmail,
    [property: JsonPropertyName("assignments")] List<AssignmentItemVm> Assignments);