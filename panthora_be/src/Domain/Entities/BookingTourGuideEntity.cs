namespace Domain.Entities;

/// <summary>
/// Phân công một hướng dẫn viên (User) vào một booking cụ thể.
/// Theo dõi vai trò được giao (Tour Guide, Local Guide, Escort), có trưởng nhóm hay không,
/// ngày phân công, và trạng thái phân công.
/// </summary>
public class BookingTourGuideEntity : Aggregate<Guid>
{
    /// <summary>ID của booking được phân công.</summary>
    public Guid BookingId { get; set; }
    /// <summary>Booking được phân công.</summary>
    public virtual BookingEntity Booking { get; set; } = null!;
    /// <summary>ID của User (hướng dẫn viên) được phân công.</summary>
    public Guid UserId { get; set; }
    /// <summary>User được phân công.</summary>
    public virtual UserEntity User { get; set; } = null!;

    /// <summary>Vai trò được giao: TourGuide, LocalGuide, Escort, Coordinator.</summary>
    public AssignedRole AssignedRole { get; set; }
    /// <summary>True nếu người này là trưởng nhóm hướng dẫn viên.</summary>
    public bool IsLead { get; set; }
    /// <summary>Ngày được phân công.</summary>
    public DateTimeOffset AssignedDate { get; set; }
    /// <summary>ID của người thực hiện phân công.</summary>
    public Guid? AssignedBy { get; set; }
    /// <summary>Trạng thái phân công: Assigned, InProgress, Completed, Cancelled.</summary>
    public AssignmentStatus Status { get; set; } = AssignmentStatus.Assigned;
    /// <summary>Ghi chú bổ sung về phân công.</summary>
    public string? Note { get; set; }

    public static BookingTourGuideEntity Create(
        Guid bookingId,
        Guid userId,
        AssignedRole assignedRole,
        string performedBy,
        bool isLead = false,
        Guid? assignedBy = null,
        string? note = null)
    {
        return new BookingTourGuideEntity
        {
            Id = Guid.CreateVersion7(),
            BookingId = bookingId,
            UserId = userId,
            AssignedRole = assignedRole,
            IsLead = isLead,
            AssignedDate = DateTimeOffset.UtcNow,
            AssignedBy = assignedBy,
            Status = AssignmentStatus.Assigned,
            Note = note,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        AssignedRole assignedRole,
        string performedBy,
        bool? isLead = null,
        AssignmentStatus? status = null,
        string? note = null)
    {
        AssignedRole = assignedRole;
        IsLead = isLead ?? IsLead;
        Status = status ?? Status;
        Note = note;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
