namespace Domain.Entities;

using Domain.Entities.Translations;

/// <summary>
/// Một hoạt động cụ thể trong một ngày của tour (TourDay).
/// Ví dụ: tham quan Bảo tàng, ăn trưa tại nhà hàng, di chuyển bằng xe bus.
/// Chứa thông tin thời gian, loại hoạt động, chi phí ước tính, và các tuyến di chuyển con.
/// </summary>
public class TourDayActivityEntity : Aggregate<Guid>
{
    /// <summary>ID của TourDay cha mà activity này thuộc về.</summary>
    public Guid TourDayId { get; set; }
    /// <summary>TourDay cha.</summary>
    public virtual TourDayEntity TourDay { get; set; } = null!;
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
    /// <summary>Chi phí ước tính của hoạt động này.</summary>
    public decimal? EstimatedCost { get; set; }
    /// <summary>True nếu hoạt động này là tùy chọn (không bắt buộc).</summary>
    public bool IsOptional { get; set; }
    /// <summary>Cờ xóa mềm.</summary>
    public bool IsDeleted { get; set; } = false;
    /// <summary>Timestamp xóa mềm.</summary>
    public DateTimeOffset? DeletedOnUtc { get; set; }
    /// <summary>Người thực hiện xóa.</summary>
    public string? DeletedBy { get; set; }
    /// <summary>Bản dịch đa ngôn ngữ cho title và description.</summary>
    public Dictionary<string, TourDayActivityTranslationData> Translations { get; set; } = [];

    // Time
    /// <summary>Thời gian bắt đầu hoạt động trong ngày.</summary>
    public TimeOnly? StartTime { get; set; }
    /// <summary>Thời gian kết thúc hoạt động.</summary>
    public TimeOnly? EndTime { get; set; }

    // Route
    /// <summary>Danh sách các tuyến di chuyển trong hoạt động này.</summary>
    public virtual List<TourPlanRouteEntity> Routes { get; set; } = [];

    // Accommodation
    /// <summary>Thông tin lưu trú (nếu loại hoạt động là Accommodation).</summary>
    public virtual TourPlanAccommodationEntity? Accommodation { get; set; }

    // Resource Links
    /// <summary>Danh sách các link tài nguyên (URL tham khảo, booking, v.v.).</summary>
    public virtual List<TourDayActivityResourceLinkEntity> ResourceLinks { get; set; } = [];

    public static TourDayActivityEntity Create(Guid tourDayId, int order, TourDayActivityType activityType, string title, string performedBy, string? description = null, string? note = null, TimeOnly? startTime = null, TimeOnly? endTime = null, decimal? estimatedCost = null, bool isOptional = false, IEnumerable<(string Url, int Order)>? resourceLinks = null)
    {
        EnsureValidOrder(order);
        EnsureValidTimeRange(startTime, endTime);
        EnsureNonNegativeEstimatedCost(estimatedCost);

        var entity = new TourDayActivityEntity
        {
            Id = Guid.CreateVersion7(),
            TourDayId = tourDayId,
            Order = order,
            ActivityType = activityType,
            Title = title,
            Description = description,
            Note = note,
            EstimatedCost = estimatedCost,
            IsOptional = isOptional,
            StartTime = startTime,
            EndTime = endTime,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };

        if (resourceLinks != null)
        {
            foreach (var link in resourceLinks)
            {
                entity.ResourceLinks.Add(TourDayActivityResourceLinkEntity.Create(entity.Id, link.Url, link.Order, performedBy));
            }
        }

        return entity;
    }

    public void Update(int order, TourDayActivityType activityType, string title, string performedBy, string? description = null, string? note = null, TimeOnly? startTime = null, TimeOnly? endTime = null, decimal? estimatedCost = null, bool isOptional = false)
    {
        EnsureValidOrder(order);
        EnsureValidTimeRange(startTime, endTime);
        EnsureNonNegativeEstimatedCost(estimatedCost);

        Order = order;
        ActivityType = activityType;
        Title = title;
        Description = description;
        Note = note;
        EstimatedCost = estimatedCost;
        IsOptional = isOptional;
        StartTime = startTime;
        EndTime = endTime;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    private static void EnsureValidOrder(int order)
    {
        if (order <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(order), "Order must be greater than zero.");
        }
    }

    private static void EnsureValidTimeRange(TimeOnly? startTime, TimeOnly? endTime)
    {
        if (startTime.HasValue && endTime.HasValue && endTime.Value < startTime.Value)
        {
            throw new ArgumentException("End time must be greater than or equal to start time.", nameof(endTime));
        }
    }

    private static void EnsureNonNegativeEstimatedCost(decimal? estimatedCost)
    {
        if (estimatedCost.HasValue && estimatedCost.Value < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(estimatedCost), "Estimated cost must be non-negative.");
        }
    }

    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        DeletedOnUtc = DateTimeOffset.UtcNow;
        DeletedBy = performedBy;
    }
}
