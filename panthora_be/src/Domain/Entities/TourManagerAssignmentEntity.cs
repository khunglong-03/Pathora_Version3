namespace Domain.Entities;

public class TourManagerAssignmentEntity : Aggregate<Guid>
{
    public Guid TourManagerId { get; set; }
    public virtual UserEntity TourManager { get; set; } = null!;

    public AssignedEntityType AssignedEntityType { get; set; }

    public Guid? AssignedUserId { get; set; }
    public virtual UserEntity? AssignedUser { get; set; }

    public Guid? AssignedTourId { get; set; }
    public virtual TourInstanceEntity? AssignedTour { get; set; }

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
