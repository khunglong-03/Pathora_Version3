namespace Domain.Entities;

/// <summary>
/// Phân công nhân viên quản lý (tour manager) cho một thực thể trong hệ thống:
/// có thể là User khác hoặc TourInstance. Định nghĩa vai trò trong nhóm
/// (trưởng nhóm, thành viên) và loại thực thể được gán.
/// </summary>
public class TourManagerAssignmentEntity : Aggregate<Guid>
{
    /// <summary>ID của User làm tour manager.</summary>
    public Guid TourManagerId { get; set; }
    /// <summary>User tour manager.</summary>
    public virtual UserEntity TourManager { get; set; } = null!;
    /// <summary>Loại thực thể được gán: User hoặc TourInstance.</summary>
    public AssignedEntityType AssignedEntityType { get; set; }
    /// <summary>ID của User được gán (khi AssignedEntityType = User).</summary>
    public Guid? AssignedUserId { get; set; }
    /// <summary>User được gán.</summary>
    public virtual UserEntity? AssignedUser { get; set; }
    /// <summary>ID của TourInstance được gán (khi AssignedEntityType = TourInstance).</summary>
    public Guid? AssignedTourId { get; set; }
    /// <summary>TourInstance được gán.</summary>
    public virtual TourInstanceEntity? AssignedTour { get; set; }
    /// <summary>Vai trò trong nhóm: TeamLeader, Member, DeputyLeader.</summary>
    public AssignedRoleInTeam? AssignedRoleInTeam { get; set; }

    public static TourManagerAssignmentEntity Create(
        Guid tourManagerId,
        AssignedEntityType entityType,
        Guid? assignedUserId,
        Guid? assignedTourId,
        AssignedRoleInTeam? roleInTeam,
        string performedBy)
    {
        return new TourManagerAssignmentEntity
        {
            Id = Guid.CreateVersion7(),
            TourManagerId = tourManagerId,
            AssignedEntityType = entityType,
            AssignedUserId = assignedUserId,
            AssignedTourId = assignedTourId,
            AssignedRoleInTeam = roleInTeam,
            CreatedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow
        };
    }
}
