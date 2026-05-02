using System.Text.Json.Serialization;

namespace Application.Contracts.TourManagerAssignment;

public sealed record AssignmentItem(
    [property: JsonPropertyName("assignedUserId")] Guid? AssignedUserId,
    [property: JsonPropertyName("assignedTourId")] Guid? AssignedTourId,
    [property: JsonPropertyName("assignedEntityType")] int AssignedEntityType,
    [property: JsonPropertyName("assignedRoleInTeam")] int? AssignedRoleInTeam);

public sealed record AssignTourManagerTeamRequest(
    [property: JsonPropertyName("tourManagerUserId")] string TourManagerUserId,
    [property: JsonPropertyName("assignments")] List<AssignmentItem> Assignments);

public sealed record BulkAssignRequest(
    [property: JsonPropertyName("managerId")] string ManagerId,
    [property: JsonPropertyName("assignments")] List<AssignmentItem> Assignments);

public sealed record RemoveAssignmentRequest(
    [property: JsonPropertyName("managerId")] string ManagerId,
    [property: JsonPropertyName("assignedUserId")] Guid? AssignedUserId,
    [property: JsonPropertyName("assignedTourId")] Guid? AssignedTourId,
    [property: JsonPropertyName("assignedEntityType")] int AssignedEntityType);
