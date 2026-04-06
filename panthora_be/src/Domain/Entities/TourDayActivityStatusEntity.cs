namespace Domain.Entities;

public class TourDayActivityStatusEntity : Aggregate<Guid>
{
    public Guid BookingId { get; set; }
    public virtual BookingEntity Booking { get; set; } = null!;
    public Guid TourDayId { get; set; }
    public virtual TourDayEntity TourDay { get; set; } = null!;

    public ActivityStatus ActivityStatus { get; set; } = ActivityStatus.NotStarted;
    public DateTimeOffset? ActualStartTime { get; set; }
    public DateTimeOffset? ActualEndTime { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public Guid? CompletedBy { get; set; }
    public string? CancellationReason { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public Guid? CancelledBy { get; set; }
    public string? Note { get; set; }

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
