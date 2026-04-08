namespace Domain.Entities;

/// <summary>
/// Trạng thái thực tế của một ngày hoạt động trong booking khi tour đang chạy.
/// Tracking ngày nào đã bắt đầu, hoàn thành, hoặc bị hủy, kèm thời gian thực tế.
/// Thuộc về một Booking cụ thể, theo dõi các hướng dẫn viên được phân công.
/// </summary>
public class TourDayActivityStatusEntity : Aggregate<Guid>
{
    /// <summary>ID của Booking chứa ngày hoạt động này.</summary>
    public Guid BookingId { get; set; }
    /// <summary>Booking cha.</summary>
    public virtual BookingEntity Booking { get; set; } = null!;
    /// <summary>ID của TourDay gốc (từ Classification).</summary>
    public Guid TourDayId { get; set; }
    /// <summary>TourDay gốc.</summary>
    public virtual TourDayEntity TourDay { get; set; } = null!;

    /// <summary>Trạng thái: NotStarted → InProgress → Completed, hoặc Cancelled.</summary>
    public ActivityStatus ActivityStatus { get; set; } = ActivityStatus.NotStarted;
    /// <summary>Thời gian bắt đầu thực tế.</summary>
    public DateTimeOffset? ActualStartTime { get; set; }
    /// <summary>Thời gian kết thúc thực tế.</summary>
    public DateTimeOffset? ActualEndTime { get; set; }
    /// <summary>Thời gian hoàn thành.</summary>
    public DateTimeOffset? CompletedAt { get; set; }
    /// <summary>ID người đánh dấu hoàn thành.</summary>
    public Guid? CompletedBy { get; set; }
    /// <summary>Lý do hủy (nếu bị hủy).</summary>
    public string? CancellationReason { get; set; }
    /// <summary>Thời gian hủy.</summary>
    public DateTimeOffset? CancelledAt { get; set; }
    /// <summary>ID người thực hiện hủy.</summary>
    public Guid? CancelledBy { get; set; }
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }

    /// <summary>Danh sách hướng dẫn viên được phân công vào ngày hoạt động này.</summary>
    public virtual List<TourDayActivityGuideEntity> ActivityGuides { get; set; } = [];

    public static TourDayActivityStatusEntity Create(Guid bookingId, Guid tourDayId, string performedBy, string? note = null)
    {
        return new TourDayActivityStatusEntity
        {
            Id = Guid.CreateVersion7(),
            BookingId = bookingId,
            TourDayId = tourDayId,
            ActivityStatus = ActivityStatus.NotStarted,
            Note = note,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Start(string performedBy, DateTimeOffset? actualStartTime = null)
    {
        if (ActivityStatus != ActivityStatus.NotStarted)
        {
            throw new InvalidOperationException("Chỉ có thể bắt đầu khi trạng thái là NotStarted.");
        }

        ActivityStatus = ActivityStatus.InProgress;
        ActualStartTime = actualStartTime ?? DateTimeOffset.UtcNow;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Complete(string performedBy, DateTimeOffset? actualEndTime = null, Guid? completedBy = null)
    {
        if (ActivityStatus != ActivityStatus.InProgress)
        {
            throw new InvalidOperationException("Chỉ có thể hoàn thành khi trạng thái là InProgress.");
        }

        ActivityStatus = ActivityStatus.Completed;
        ActualEndTime = actualEndTime ?? DateTimeOffset.UtcNow;
        CompletedAt = DateTimeOffset.UtcNow;
        CompletedBy = completedBy;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Cancel(string reason, string performedBy, Guid? cancelledBy = null)
    {
        if (ActivityStatus is not ActivityStatus.NotStarted and not ActivityStatus.InProgress)
        {
            throw new InvalidOperationException("Chỉ có thể hủy khi trạng thái là NotStarted hoặc InProgress.");
        }

        ActivityStatus = ActivityStatus.Cancelled;
        CancellationReason = reason;
        CancelledAt = DateTimeOffset.UtcNow;
        CancelledBy = cancelledBy;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
