namespace Domain.Entities;

using Domain.Entities.Translations;

/// <summary>
/// Lịch trình di chuyển trong một ngày hoạt động của tour. Gắn với
/// TourDayActivity, lưu điểm đi, điểm đến, phương tiện, thời gian, khoảng
/// cách và giá. Có thể có nhiều route trong một ngày.
/// </summary>
public class TourPlanRouteEntity : Aggregate<Guid>
{
    /// <summary>Thứ tự lộ trình trong ngày (1, 2, 3...).</summary>
    public int Order { get; set; }
    /// <summary>Loại phương tiện: Flight, Bus, Train, Car, Ferry, Walk.</summary>
    public TransportationType TransportationType { get; set; }
    /// <summary>Tên hãng/phương tiện cụ thể (VD: Vietnam Airlines, TuoiTre Bus).</summary>
    public string? TransportationName { get; set; }
    /// <summary>Ghi chú về phương tiện (VD: số hiệu chuyến bay).</summary>
    public string? TransportationNote { get; set; }
    /// <summary>Điểm khởi hành.</summary>
    public virtual TourPlanLocationEntity? FromLocation { get; set; }
    /// <summary>Điểm đến.</summary>
    public virtual TourPlanLocationEntity? ToLocation { get; set; }
    /// <summary>Giờ khởi hành dự kiến.</summary>
    public TimeOnly? EstimatedDepartureTime { get; set; }
    /// <summary>Giờ đến dự kiến.</summary>
    public TimeOnly? EstimatedArrivalTime { get; set; }
    /// <summary>Thời gian di chuyển dự kiến (phút).</summary>
    public int? DurationMinutes { get; set; }
    /// <summary>Khoảng cách ước tính (km).</summary>
    public decimal? DistanceKm { get; set; }
    /// <summary>Giá vận chuyển.</summary>
    public decimal? Price { get; set; }
    /// <summary>Mã booking/ vé đã đặt cho chuyến đi.</summary>
    public string? BookingReference { get; set; }
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }
    /// <summary>Đánh dấu đã xóa mềm.</summary>
    public bool IsDeleted { get; set; } = false;
    /// <summary>Thời gian xóa mềm.</summary>
    public DateTimeOffset? DeletedOnUtc { get; set; }
    /// <summary>User đã xóa.</summary>
    public string? DeletedBy { get; set; }
    /// <summary>Bản dịch đa ngôn ngữ cho tên và ghi chú.</summary>
    public Dictionary<string, TourPlanRouteTranslationData> Translations { get; set; } = [];
    /// <summary>FK đến TourDayActivity mà lộ trình này thuộc về.</summary>
    public Guid TourDayActivityId { get; set; }
    /// <summary>TourDayActivity mà lộ trình này thuộc về.</summary>
    public virtual TourDayActivityEntity TourDayActivity { get; set; } = null!;

    public static TourPlanRouteEntity Create(int order, TransportationType transportationType, string performedBy, string? transportationName = null, string? transportationNote = null, TimeOnly? estimatedDepartureTime = null, TimeOnly? estimatedArrivalTime = null, int? durationMinutes = null, decimal? distanceKm = null, decimal? price = null, string? bookingReference = null, string? note = null)
    {
        EnsureValidOrder(order);
        EnsureValidTimeRange(estimatedDepartureTime, estimatedArrivalTime);
        EnsureNonNegativeValues(durationMinutes, distanceKm, price);

        return new TourPlanRouteEntity
        {
            Id = Guid.CreateVersion7(),
            Order = order,
            TransportationType = transportationType,
            TransportationName = transportationName,
            TransportationNote = transportationNote,
            EstimatedDepartureTime = estimatedDepartureTime,
            EstimatedArrivalTime = estimatedArrivalTime,
            DurationMinutes = durationMinutes,
            DistanceKm = distanceKm,
            Price = price,
            BookingReference = bookingReference,
            Note = note,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(int order, TransportationType transportationType, string performedBy, string? transportationName = null, string? transportationNote = null, TimeOnly? estimatedDepartureTime = null, TimeOnly? estimatedArrivalTime = null, int? durationMinutes = null, decimal? distanceKm = null, decimal? price = null, string? bookingReference = null, string? note = null)
    {
        EnsureValidOrder(order);
        EnsureValidTimeRange(estimatedDepartureTime, estimatedArrivalTime);
        EnsureNonNegativeValues(durationMinutes, distanceKm, price);

        Order = order;
        TransportationType = transportationType;
        TransportationName = transportationName;
        TransportationNote = transportationNote;
        EstimatedDepartureTime = estimatedDepartureTime;
        EstimatedArrivalTime = estimatedArrivalTime;
        DurationMinutes = durationMinutes;
        DistanceKm = distanceKm;
        Price = price;
        BookingReference = bookingReference;
        Note = note;
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

    private static void EnsureValidTimeRange(TimeOnly? departureTime, TimeOnly? arrivalTime)
    {
        if (departureTime.HasValue && arrivalTime.HasValue && arrivalTime.Value < departureTime.Value)
        {
            throw new ArgumentException("Arrival time must be greater than or equal to departure time.", nameof(arrivalTime));
        }
    }

    private static void EnsureNonNegativeValues(int? durationMinutes, decimal? distanceKm, decimal? price)
    {
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
