namespace Domain.Entities;

/// <summary>
/// Chi tiết lưu trú được đặt cho một BookingActivityReservation.
/// Theo dõi thông tin khách sạn/nhà nghỉ: tên, loại phòng, số phòng,
/// thời gian check-in/check-out, giá mua (trước/sau thuế), mã xác nhận.
/// </summary>
public class BookingAccommodationDetailEntity : Aggregate<Guid>
{
    /// <summary>ID của BookingActivityReservation cha.</summary>
    public Guid BookingActivityReservationId { get; set; }
    /// <summary>BookingActivityReservation cha.</summary>
    public virtual BookingActivityReservationEntity BookingActivityReservation { get; set; } = null!;
    /// <summary>ID nhà cung cấp lưu trú (khách sạn).</summary>
    public Guid? SupplierId { get; set; }
    /// <summary>Nhà cung cấp lưu trú.</summary>
    public virtual SupplierEntity? Supplier { get; set; }

    /// <summary>Tên khách sạn / cơ sở lưu trú.</summary>
    public string AccommodationName { get; set; } = null!;
    /// <summary>Loại phòng: Standard, Deluxe, Suite, v.v.</summary>
    public RoomType RoomType { get; set; }
    /// <summary>Số lượng phòng đặt.</summary>
    public int RoomCount { get; set; } = 1;
    /// <summary>Loại giường: Double, Twin, Triple, v.v.</summary>
    public string? BedType { get; set; }
    /// <summary>Địa chỉ khách sạn.</summary>
    public string? Address { get; set; }
    /// <summary>Số điện thoại liên hệ khách sạn.</summary>
    public string? ContactPhone { get; set; }
    /// <summary>Thời gian check-in dự kiến.</summary>
    public DateTimeOffset? CheckInAt { get; set; }
    /// <summary>Thời gian check-out dự kiến.</summary>
    public DateTimeOffset? CheckOutAt { get; set; }
    /// <summary>Giá mua dịch vụ lưu trú (chưa thuế).</summary>
    public decimal BuyPrice { get; set; }
    /// <summary>Tỷ lệ thuế (%).</summary>
    public decimal TaxRate { get; set; }
    /// <summary>Tổng giá sau khi đã cộng thuế.</summary>
    public decimal TotalBuyPrice { get; set; }
    /// <summary>True nếu dịch vụ này chịu thuế.</summary>
    public bool IsTaxable { get; set; }
    /// <summary>Mã xác nhận đặt phòng từ khách sạn.</summary>
    public string? ConfirmationCode { get; set; }
    /// <summary>URL file đính kèm (voucher, hóa đơn).</summary>
    public string? FileUrl { get; set; }
    /// <summary>Yêu cầu đặc biệt về lưu trú.</summary>
    public string? SpecialRequest { get; set; }
    /// <summary>Trạng thái đặt phòng: Pending, Confirmed, Cancelled.</summary>
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }

    public static BookingAccommodationDetailEntity Create(
        Guid bookingActivityReservationId,
        string accommodationName,
        RoomType roomType,
        string performedBy,
        int roomCount = 1,
        Guid? supplierId = null,
        string? bedType = null,
        string? address = null,
        string? contactPhone = null,
        DateTimeOffset? checkInAt = null,
        DateTimeOffset? checkOutAt = null,
        decimal buyPrice = 0,
        decimal taxRate = 0,
        bool isTaxable = true,
        string? confirmationCode = null,
        string? fileUrl = null,
        string? specialRequest = null,
        string? note = null)
    {
        EnsureValidTimeRange(checkInAt, checkOutAt);
        EnsurePositive(roomCount, nameof(roomCount));
        EnsureNonNegative(buyPrice, nameof(buyPrice));
        EnsureNonNegative(taxRate, nameof(taxRate));

        var totalBuyPrice = isTaxable ? buyPrice + (buyPrice * taxRate / 100) : buyPrice;

        return new BookingAccommodationDetailEntity
        {
            Id = Guid.CreateVersion7(),
            BookingActivityReservationId = bookingActivityReservationId,
            SupplierId = supplierId,
            AccommodationName = accommodationName,
            RoomType = roomType,
            RoomCount = roomCount,
            BedType = bedType,
            Address = address,
            ContactPhone = contactPhone,
            CheckInAt = checkInAt,
            CheckOutAt = checkOutAt,
            BuyPrice = buyPrice,
            TaxRate = taxRate,
            TotalBuyPrice = totalBuyPrice,
            IsTaxable = isTaxable,
            ConfirmationCode = confirmationCode,
            FileUrl = fileUrl,
            SpecialRequest = specialRequest,
            Status = ReservationStatus.Pending,
            Note = note,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string accommodationName,
        RoomType roomType,
        string performedBy,
        int? roomCount = null,
        Guid? supplierId = null,
        string? bedType = null,
        string? address = null,
        string? contactPhone = null,
        DateTimeOffset? checkInAt = null,
        DateTimeOffset? checkOutAt = null,
        decimal? buyPrice = null,
        decimal? taxRate = null,
        bool? isTaxable = null,
        string? confirmationCode = null,
        string? fileUrl = null,
        string? specialRequest = null,
        ReservationStatus? status = null,
        string? note = null)
    {
        EnsureValidTimeRange(checkInAt, checkOutAt);

        if (roomCount.HasValue)
        {
            EnsurePositive(roomCount.Value, nameof(roomCount));
            RoomCount = roomCount.Value;
        }

        if (buyPrice.HasValue)
        {
            EnsureNonNegative(buyPrice.Value, nameof(buyPrice));
            BuyPrice = buyPrice.Value;
        }

        if (taxRate.HasValue)
        {
            EnsureNonNegative(taxRate.Value, nameof(taxRate));
            TaxRate = taxRate.Value;
        }

        AccommodationName = accommodationName;
        RoomType = roomType;
        SupplierId = supplierId;
        BedType = bedType;
        Address = address;
        ContactPhone = contactPhone;
        CheckInAt = checkInAt;
        CheckOutAt = checkOutAt;
        IsTaxable = isTaxable ?? IsTaxable;
        TotalBuyPrice = IsTaxable ? BuyPrice + (BuyPrice * TaxRate / 100) : BuyPrice;
        ConfirmationCode = confirmationCode;
        FileUrl = fileUrl;
        SpecialRequest = specialRequest;
        Status = status ?? Status;
        Note = note;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    private static void EnsureValidTimeRange(DateTimeOffset? checkInAt, DateTimeOffset? checkOutAt)
    {
        if (checkInAt.HasValue && checkOutAt.HasValue && checkOutAt.Value <= checkInAt.Value)
        {
            throw new ArgumentException("CheckOutAt phải lớn hơn CheckInAt.", nameof(checkOutAt));
        }
    }

    private static void EnsureNonNegative(decimal value, string paramName)
    {
        if (value < 0)
        {
            throw new ArgumentOutOfRangeException(paramName, "Giá trị không được âm.");
        }
    }

    private static void EnsurePositive(int value, string paramName)
    {
        if (value <= 0)
        {
            throw new ArgumentOutOfRangeException(paramName, "Giá trị phải lớn hơn 0.");
        }
    }
}
