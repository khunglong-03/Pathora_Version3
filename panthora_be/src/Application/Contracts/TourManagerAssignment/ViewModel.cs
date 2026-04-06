namespace Application.Contracts.TourManagerAssignment;

public sealed record AssignmentItemVm(
    Guid Id,
    Guid? UserId,
    string? UserName,
    string? UserEmail,
    Guid? TourId,
    string? TourName,
    int EntityType,
    int? RoleInTeam,
    DateTimeOffset CreatedAt);

public sealed record TourManagerSummaryVm(
    Guid ManagerId,
    string ManagerName,
    string ManagerEmail,
    int DesignerCount,
    int GuideCount,
    int TourCount);

public sealed record TourManagerAssignmentDetailVm(
    Guid ManagerId,
    string ManagerName,
    string ManagerEmail,
    List<AssignmentItemVm> Assignments);