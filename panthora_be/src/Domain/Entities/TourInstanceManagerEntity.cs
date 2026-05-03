namespace Domain.Entities;

/// <summary>
/// Phân công một nhân viên (User) làm quản lý cho một TourInstance cụ thể.
/// Theo dõi vai trò trong instance: Manager, Coordinator, v.v.
/// </summary>
public class TourInstanceManagerEntity : Aggregate<Guid>
{
    /// <summary>ID của TourInstance được phân công.</summary>
    public Guid TourInstanceId { get; set; }
    /// <summary>TourInstance được phân công.</summary>
    public virtual TourInstanceEntity TourInstance { get; set; } = null!;

    /// <summary>ID của User được phân công.</summary>
    public Guid UserId { get; set; }
    /// <summary>User được phân công.</summary>
    public virtual UserEntity User { get; set; } = null!;

    /// <summary>Vai trò của nhân viên trong instance: Manager, Coordinator, Assistant.</summary>
    public TourInstanceManagerRole Role { get; set; }

    /// <summary>Đánh dấu Guide đã phê duyệt/nhận chuyến đi này hay chưa.</summary>
    public bool IsAccepted { get; set; } = false;

    public static TourInstanceManagerEntity Create(
        Guid tourInstanceId,
        Guid userId,
        TourInstanceManagerRole role,
        string performedBy)
    {
        // CreatedOnUtc intentionally left default — AppDbContext.UpdateAuditableEntities
        // sets it on SaveChanges. The repo Update() fixup also relies on default
        // CreatedOnUtc to force EntityState.Added for entities mistakenly marked
        // Modified by EF when added via tracked navigation collection with pre-set Id.
        return new TourInstanceManagerEntity
        {
            Id = Guid.CreateVersion7(),
            TourInstanceId = tourInstanceId,
            UserId = userId,
            Role = role,
            CreatedBy = performedBy
        };
    }

    public void UpdateRole(TourInstanceManagerRole newRole, string performedBy)
    {
        Role = newRole;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
