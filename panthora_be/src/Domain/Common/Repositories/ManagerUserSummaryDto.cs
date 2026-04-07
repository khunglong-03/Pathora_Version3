namespace Domain.Common.Repositories;

public sealed record ManagerUserSummaryDto(
    Guid ManagerId,
    string ManagerName,
    string ManagerEmail,
    int DesignerCount,
    int GuideCount,
    int TourCount);
