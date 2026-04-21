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

    // Transportation (Flat fields)
    public Guid? FromLocationId { get; set; }
    public virtual TourPlanLocationEntity? FromLocation { get; set; }
    public Guid? ToLocationId { get; set; }
    public virtual TourPlanLocationEntity? ToLocation { get; set; }
    public TransportationType? TransportationType { get; set; }
    public string? TransportationName { get; set; }
    public int? DurationMinutes { get; set; }
    public decimal? DistanceKm { get; set; }
    public decimal? Price { get; set; }
    public string? BookingReference { get; set; }

    // Accommodation
    /// <summary>Thông tin lưu trú (nếu loại hoạt động là Accommodation).</summary>
    public virtual TourPlanAccommodationEntity? Accommodation { get; set; }

    public static TourDayActivityEntity Create(Guid tourDayId, int order, TourDayActivityType activityType, string title, string performedBy, string? description = null, string? note = null, TimeOnly? startTime = null, TimeOnly? endTime = null, decimal? estimatedCost = null, bool isOptional = false, Guid? fromLocationId = null, Guid? toLocationId = null, TransportationType? transportationType = null, string? transportationName = null, int? durationMinutes = null, decimal? distanceKm = null, decimal? price = null, string? bookingReference = null)
    {
        EnsureValidOrder(order);
        EnsureValidTimeRange(startTime, endTime);
        EnsureNonNegativeEstimatedCost(estimatedCost);
        EnsureValidTransportFields(activityType, transportationType, durationMinutes, distanceKm, price);

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
            FromLocationId = fromLocationId,
            ToLocationId = toLocationId,
            TransportationType = transportationType,
            TransportationName = transportationName,
            DurationMinutes = durationMinutes,
            DistanceKm = distanceKm,
            Price = price,
            BookingReference = bookingReference,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };

        return entity;
    }

    public void Update(int order, TourDayActivityType activityType, string title, string performedBy, string? description = null, string? note = null, TimeOnly? startTime = null, TimeOnly? endTime = null, decimal? estimatedCost = null, bool isOptional = false, Guid? fromLocationId = null, Guid? toLocationId = null, TransportationType? transportationType = null, string? transportationName = null, int? durationMinutes = null, decimal? distanceKm = null, decimal? price = null, string? bookingReference = null)
    {
        EnsureValidOrder(order);
        EnsureValidTimeRange(startTime, endTime);
        EnsureNonNegativeEstimatedCost(estimatedCost);
        EnsureValidTransportFields(activityType, transportationType, durationMinutes, distanceKm, price);

        Order = order;
        ActivityType = activityType;
        Title = title;
        Description = description;
        Note = note;
        EstimatedCost = estimatedCost;
        IsOptional = isOptional;
        StartTime = startTime;
        EndTime = endTime;
        FromLocationId = fromLocationId;
        ToLocationId = toLocationId;
        TransportationType = transportationType;
        TransportationName = transportationName;
        DurationMinutes = durationMinutes;
        DistanceKm = distanceKm;
        Price = price;
        BookingReference = bookingReference;
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

    private static void EnsureValidTransportFields(TourDayActivityType activityType, TransportationType? transportationType, int? durationMinutes, decimal? distanceKm, decimal? price)
    {
        if (activityType == TourDayActivityType.Transportation)
        {
            if (transportationType == null)
            {
                throw new ArgumentNullException(nameof(transportationType), "TransportationType is required for Transportation activities.");
            }
        }

        if (durationMinutes.HasValue && durationMinutes.Value < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(durationMinutes), "Duration minutes must be non-negative.");
        }

        if (distanceKm.HasValue && distanceKm.Value < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(distanceKm), "Distance must be non-negative.");
        }

        if (price.HasValue && price.Value < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(price), "Price must be non-negative.");
        }
    }

    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        DeletedOnUtc = DateTimeOffset.UtcNow;
        DeletedBy = performedBy;
    }
}
