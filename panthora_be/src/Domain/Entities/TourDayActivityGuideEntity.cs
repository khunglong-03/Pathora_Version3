namespace Domain.Entities;

/// <summary>
/// Phân công hướng dẫn viên (guide) cho một ngày hoạt động trong booking.
/// Mỗi bản ghi gắn một User với một TourDayActivityStatus và ghi nhận
/// vai trò (chính hay hỗ trợ), thời gian check-in/out.
/// </summary>
public class TourDayActivityGuideEntity : Aggregate<Guid>
{
    /// <summary>ID của TourDayActivityStatus mà guide được phân công.</summary>
    public Guid TourDayActivityStatusId { get; set; }
    /// <summary>TourDayActivityStatus liên quan.</summary>
    public virtual TourDayActivityStatusEntity TourDayActivityStatus { get; set; } = null!;
    /// <summary>ID của User được phân công làm guide.</summary>
    public Guid UserId { get; set; }
    /// <summary>User/guide được phân công.</summary>
    public virtual UserEntity User { get; set; } = null!;
    /// <summary>Vai trò của guide: Lead (chính) hoặc Support (hỗ trợ).</summary>
    public GuideRole Role { get; set; } = GuideRole.Support;
    /// <summary>Thời gian bắt đầu làm việc của guide.</summary>
    public DateTimeOffset? CheckInTime { get; set; }
    /// <summary>Thời gian kết thúc làm việc của guide.</summary>
    public DateTimeOffset? CheckOutTime { get; set; }
    /// <summary>Ghi chú bổ sung.</summary>
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
