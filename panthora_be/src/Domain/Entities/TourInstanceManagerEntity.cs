namespace Domain.Entities;

public class TourInstanceManagerEntity : Aggregate<Guid>
{
    public Guid TourInstanceId { get; set; }
    public virtual TourInstanceEntity TourInstance { get; set; } = null!;

    public Guid UserId { get; set; }
    public virtual UserEntity User { get; set; } = null!;

    public TourInstanceManagerRole Role { get; set; }

    public static TourInstanceManagerEntity Create(
        Guid tourInstanceId,
        Guid userId,
        TourInstanceManagerRole role,
        string performedBy)
    {
        return new TourInstanceManagerEntity
        {
            Id = Guid.CreateVersion7(),
            TourInstanceId = tourInstanceId,
            UserId = userId,
            Role = role,
            CreatedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void UpdateRole(TourInstanceManagerRole newRole, string performedBy)
    {
        Role = newRole;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
