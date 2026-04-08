namespace Domain.Entities;

/// <summary>
/// Đại diện cho một hoạt động đã được đặt (reserved) trong một booking cụ thể.
/// Ví dụ: một ngày tham quan, một chuyến đi, một điểm đến.
/// Liên kết với nhà cung cấp, theo dõi thời gian, giá dịch vụ (trước/sau thuế),
/// và có các danh sách chi tiết vận chuyển &amp; lưu trú con.
/// </summary>
public class BookingActivityReservationEntity : Aggregate<Guid>
{
    /// <summary>ID của booking cha.</summary>
    public Guid BookingId { get; set; }
    /// <summary>Booking cha chứa activity reservation này.</summary>
    public virtual BookingEntity Booking { get; set; } = null!;
    /// <summary>ID nhà cung cấp dịch vụ cho hoạt động này (optional).</summary>
    public Guid? SupplierId { get; set; }
    /// <summary>Nhà cung cấp dịch vụ.</summary>
    public virtual SupplierEntity? Supplier { get; set; }
    /// <summary>Thứ tự sắp xếp của hoạt động trong ngày/plan.</summary>
    public int Order { get; set; }
    /// <summary>Loại hoạt động (day tour, attraction, transport, v.v.).</summary>
    public string ActivityType { get; set; } = null!;
    /// <summary>Tên/mô tả tiêu đề của hoạt động.</summary>
    public string Title { get; set; } = null!;
    /// <summary>Mô tả chi tiết hơn về hoạt động.</summary>
    public string? Description { get; set; }
    /// <summary>Thời gian bắt đầu dự kiến của hoạt động.</summary>
    public DateTimeOffset? StartTime { get; set; }
    /// <summary>Thời gian kết thúc dự kiến.</summary>
    public DateTimeOffset? EndTime { get; set; }
    /// <summary>Tổng giá dịch vụ chưa bao gồm thuế.</summary>
    public decimal TotalServicePrice { get; set; }
    /// <summary>Tổng giá dịch vụ sau khi đã cộng thuế.</summary>
    public decimal TotalServicePriceAfterTax { get; set; }
    /// <summary>Trạng thái đặt chỗ: Pending, Confirmed, Cancelled.</summary>
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;
    /// <summary>Ghi chú bổ sung về hoạt động này.</summary>
    public string? Note { get; set; }

    /// <summary>Danh sách chi tiết vận chuyển con của hoạt động này.</summary>
    public virtual List<BookingTransportDetailEntity> TransportDetails { get; set; } = [];
    /// <summary>Danh sách chi tiết lưu trú con của hoạt động này.</summary>
    public virtual List<BookingAccommodationDetailEntity> AccommodationDetails { get; set; } = [];

    public static BookingActivityReservationEntity Create(
        Guid bookingId,
        int order,
        string activityType,
        string title,
        string performedBy,
        Guid? supplierId = null,
        string? description = null,
        DateTimeOffset? startTime = null,
        DateTimeOffset? endTime = null,
        decimal totalServicePrice = 0,
        decimal totalServicePriceAfterTax = 0,
        string? note = null)
    {
        EnsureValidOrder(order);
        EnsureValidTimeRange(startTime, endTime);
        EnsureNonNegativePrice(totalServicePrice, nameof(totalServicePrice));
        EnsureNonNegativePrice(totalServicePriceAfterTax, nameof(totalServicePriceAfterTax));

        return new BookingActivityReservationEntity
        {
            Id = Guid.CreateVersion7(),
            BookingId = bookingId,
            SupplierId = supplierId,
            Order = order,
            ActivityType = activityType,
            Title = title,
            Description = description,
            StartTime = startTime,
            EndTime = endTime,
            TotalServicePrice = totalServicePrice,
            TotalServicePriceAfterTax = totalServicePriceAfterTax,
            Status = ReservationStatus.Pending,
            Note = note,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        int order,
        string activityType,
        string title,
        string performedBy,
        Guid? supplierId = null,
        string? description = null,
        DateTimeOffset? startTime = null,
        DateTimeOffset? endTime = null,
        decimal? totalServicePrice = null,
        decimal? totalServicePriceAfterTax = null,
        ReservationStatus? status = null,
        string? note = null)
    {
        EnsureValidOrder(order);
        EnsureValidTimeRange(startTime, endTime);

        if (totalServicePrice.HasValue)
        {
            EnsureNonNegativePrice(totalServicePrice.Value, nameof(totalServicePrice));
            TotalServicePrice = totalServicePrice.Value;
        }

        if (totalServicePriceAfterTax.HasValue)
        {
            EnsureNonNegativePrice(totalServicePriceAfterTax.Value, nameof(totalServicePriceAfterTax));
            TotalServicePriceAfterTax = totalServicePriceAfterTax.Value;
        }

        Order = order;
        ActivityType = activityType;
        Title = title;
        SupplierId = supplierId;
        Description = description;
        StartTime = startTime;
        EndTime = endTime;
        Status = status ?? Status;
        Note = note;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    private static void EnsureValidOrder(int order)
    {
        if (order <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(order), "Order phải lớn hơn 0.");
        }
    }

    private static void EnsureValidTimeRange(DateTimeOffset? startTime, DateTimeOffset? endTime)
    {
        if (startTime.HasValue && endTime.HasValue && endTime.Value < startTime.Value)
        {
            throw new ArgumentException("EndTime phải lớn hơn hoặc bằng StartTime.", nameof(endTime));
        }
    }

    private static void EnsureNonNegativePrice(decimal value, string paramName)
    {
        if (value < 0)
        {
            throw new ArgumentOutOfRangeException(paramName, "Giá trị tiền không được âm.");
        }
    }
}
