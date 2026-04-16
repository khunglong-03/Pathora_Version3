using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Một hoạt động cụ thể trong một ngày của TourInstance.
/// Bản sao độc lập của TourDayActivityEntity để gán lịch trình thực tế.
/// </summary>
public class TourInstanceDayActivityEntity : Aggregate<Guid>
{
    /// <summary>ID của TourInstanceDay cha mà activity này thuộc về.</summary>
    public Guid TourInstanceDayId { get; set; }
    /// <summary>TourInstanceDay cha.</summary>
    public virtual TourInstanceDayEntity TourInstanceDay { get; set; } = null!;

    /// <summary>Thứ tự sắp xếp hoạt động trong ngày.</summary>
    public int Order { get; set; }
    /// <summary>Loại hoạt động: Sightseeing, Meal, Transport, Accommodation, FreeTime, v.v.</summary>
    public TourDayActivityType ActivityType { get; set; }
    /// <summary>Tiêu đề hoạt động.</summary>
    public string Title { get; set; } = null!;
    /// <summary>Mô tả chi tiết hoạt động.</summary>
    public string? Description { get; set; }
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }
    /// <summary>True nếu hoạt động này là tùy chọn (không bắt buộc).</summary>
    public bool IsOptional { get; set; }

    // Time
    /// <summary>Thời gian bắt đầu hoạt động trong ngày.</summary>
    public TimeOnly? StartTime { get; set; }
    /// <summary>Thời gian kết thúc hoạt động.</summary>
    public TimeOnly? EndTime { get; set; }

    // Tách nhánh thông tin lịch trình cho Accommodation
    public virtual TourInstancePlanAccommodationEntity? Accommodation { get; set; }

    // Tách nhánh thông tin lịch trình cho Route (Transport)
    public virtual List<TourInstancePlanRouteEntity> Routes { get; set; } = [];

    // Tách nhánh thông tin lịch trình cho Accommodation Room Blocks
    public virtual List<RoomBlockEntity> RoomBlocks { get; set; } = [];

    public static TourInstanceDayActivityEntity Create(
        Guid tourInstanceDayId,
        int order,
        TourDayActivityType activityType,
        string title,
        string performedBy,
        string? description = null,
        string? note = null,
        TimeOnly? startTime = null,
        TimeOnly? endTime = null,
        bool isOptional = false)
    {
        var entity = new TourInstanceDayActivityEntity
        {
            Id = Guid.CreateVersion7(),
            TourInstanceDayId = tourInstanceDayId,
            Order = order,
            ActivityType = activityType,
            Title = title,
            Description = description,
            Note = note,
            IsOptional = isOptional,
            StartTime = startTime,
            EndTime = endTime,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };

        return entity;
    }

    public void Update(int order, TourDayActivityType activityType, string title, string performedBy, string? description = null, string? note = null, TimeOnly? startTime = null, TimeOnly? endTime = null, bool isOptional = false)
    {
        Order = order;
        ActivityType = activityType;
        Title = title;
        Description = description;
        Note = note;
        IsOptional = isOptional;
        StartTime = startTime;
        EndTime = endTime;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
