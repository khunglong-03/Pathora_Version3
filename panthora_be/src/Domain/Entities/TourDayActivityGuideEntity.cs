namespace Domain.Entities;

public class TourDayActivityGuideEntity : Aggregate<Guid>
{
    public Guid TourDayActivityStatusId { get; set; }
    public virtual TourDayActivityStatusEntity TourDayActivityStatus { get; set; } = null!;
    public Guid UserId { get; set; }
    public virtual UserEntity User { get; set; } = null!;

    public GuideRole Role { get; set; } = GuideRole.Support;
    public DateTimeOffset? CheckInTime { get; set; }
    public DateTimeOffset? CheckOutTime { get; set; }
    public string? Note { get; set; }

    public static TourDayActivityGuideEntity Create(
        Guid tourDayActivityStatusId,
        Guid userId,
        GuideRole role,
        string performedBy,
        DateTimeOffset? checkInTime = null,
        DateTimeOffset? checkOutTime = null,
        string? note = null)
    {
        EnsureValidTimeRange(checkInTime, checkOutTime);

        return new TourDayActivityGuideEntity
        {
            Id = Guid.CreateVersion7(),
            TourDayActivityStatusId = tourDayActivityStatusId,
            UserId = userId,
            Role = role,
            CheckInTime = checkInTime,
            CheckOutTime = checkOutTime,
            Note = note,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        GuideRole role,
        string performedBy,
        DateTimeOffset? checkInTime = null,
        DateTimeOffset? checkOutTime = null,
        string? note = null)
    {
        EnsureValidTimeRange(checkInTime, checkOutTime);

        Role = role;
        CheckInTime = checkInTime;
        CheckOutTime = checkOutTime;
        Note = note;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    private static void EnsureValidTimeRange(DateTimeOffset? checkInTime, DateTimeOffset? checkOutTime)
    {
        if (checkInTime.HasValue && checkOutTime.HasValue && checkOutTime.Value < checkInTime.Value)
        {
            throw new ArgumentException("CheckOutTime phải lớn hơn hoặc bằng CheckInTime.", nameof(checkOutTime));
        }
    }
}
