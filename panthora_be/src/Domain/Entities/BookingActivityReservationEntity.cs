namespace Domain.Entities;

public class BookingActivityReservationEntity : Aggregate<Guid>
{
    public Guid BookingId { get; set; }
    public virtual BookingEntity Booking { get; set; } = null!;
    public Guid? SupplierId { get; set; }
    public virtual SupplierEntity? Supplier { get; set; }

    public int Order { get; set; }
    public string ActivityType { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public DateTimeOffset? StartTime { get; set; }
    public DateTimeOffset? EndTime { get; set; }
    public decimal TotalServicePrice { get; set; }
    public decimal TotalServicePriceAfterTax { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;
    public string? Note { get; set; }

    public virtual List<BookingTransportDetailEntity> TransportDetails { get; set; } = [];
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
