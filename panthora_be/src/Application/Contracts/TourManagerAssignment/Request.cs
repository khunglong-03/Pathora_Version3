namespace Application.Contracts.TourManagerAssignment;

public sealed record AssignmentItem(
    Guid? AssignedUserId,
    Guid? AssignedTourId,
    int AssignedEntityType,
    int? AssignedRoleInTeam);

public sealed record AssignTourManagerTeamRequest(
    string TourManagerUserId,
    List<AssignmentItem> Assignments);

public sealed record BulkAssignRequest(
    string ManagerId,
    List<AssignmentItem> Assignments);

public sealed record RemoveAssignmentRequest(
    string ManagerId,
    Guid? AssignedUserId,
    Guid? AssignedTourId,
    int AssignedEntityType);
