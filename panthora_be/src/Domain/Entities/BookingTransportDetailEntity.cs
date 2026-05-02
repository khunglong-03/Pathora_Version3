namespace Domain.Entities;

/// <summary>
/// Chi tiết vận chuyển được đặt cho một BookingActivityReservation.
/// Theo dõi loại phương tiện, thời gian khởi hành/đến, thông tin vé (số ghế, số vé điện tử),
/// giá mua (trước/sau thuế), và trạng thái đặt chỗ.
/// </summary>
public class BookingTransportDetailEntity : Aggregate<Guid>
{
    /// <summary>ID của BookingActivityReservation cha mà detail này thuộc về.</summary>
    public Guid BookingActivityReservationId { get; set; }
    /// <summary>BookingActivityReservation cha.</summary>
    public virtual BookingActivityReservationEntity BookingActivityReservation { get; set; } = null!;
    /// <summary>
    /// ID của BookingParticipant mà vé này được gán (nullable).
    /// Chỉ dùng cho loại vé per-participant: Airplane, Train, Ship.
    /// </summary>
    public Guid? BookingParticipantId { get; set; }
    /// <summary>Participant được gán vé (nullable navigation).</summary>
    public virtual BookingParticipantEntity? BookingParticipant { get; set; }
    /// <summary>Tên hành khách (denormalized để hiển thị, dùng khi không cần join participant).</summary>
    public string? PassengerName { get; set; }
    /// <summary>ID nhà cung cấp vận chuyển (hãng xe, hãng bay, v.v.).</summary>
    public Guid? SupplierId { get; set; }
    /// <summary>Nhà cung cấp vận chuyển.</summary>
    public virtual SupplierEntity? Supplier { get; set; }

    /// <summary>Loại phương tiện: Flight, Train, Bus, Car, Ferry, v.v.</summary>
    public TransportType TransportType { get; set; }
    /// <summary>Thời gian khởi hành dự kiến.</summary>
    public DateTimeOffset? DepartureAt { get; set; }
    /// <summary>Thời gian đến dự kiến.</summary>
    public DateTimeOffset? ArrivalAt { get; set; }
    /// <summary>Số vé / mã vé.</summary>
    public string? TicketNumber { get; set; }
    /// <summary>Số vé điện tử (e-ticket).</summary>
    public string? ETicketNumber { get; set; }
    /// <summary>Số ghế ngồi.</summary>
    public string? SeatNumber { get; set; }
    /// <summary>Sức chứa ghế (số lượng hành khách).</summary>
    public int SeatCapacity { get; set; }
    /// <summary>Hạng ghế (Economy, Business, First Class, v.v.).</summary>
    public string? SeatClass { get; set; }
    /// <summary>Số hiệu phương tiện (biển số xe, mã chuyến bay, v.v.).</summary>
    public string? VehicleNumber { get; set; }
    /// <summary>Giá mua dịch vụ vận chuyển (chưa thuế).</summary>
    public decimal BuyPrice { get; set; }
    /// <summary>Tỷ lệ thuế (%).</summary>
    public decimal TaxRate { get; set; }
    /// <summary>Tổng giá sau khi đã cộng thuế (nếu IsTaxable=true).</summary>
    public decimal TotalBuyPrice { get; set; }
    /// <summary>True nếu dịch vụ này chịu thuế.</summary>
    public bool IsTaxable { get; set; }
    /// <summary>URL file đính kèm (vé, hóa đơn, v.v.).</summary>
    public string? FileUrl { get; set; }
    /// <summary>Yêu cầu đặc biệt về vận chuyển.</summary>
    public string? SpecialRequest { get; set; }
    /// <summary>Trạng thái đặt chỗ vận chuyển.</summary>
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }

    public static BookingTransportDetailEntity Create(
        Guid bookingActivityReservationId,
        TransportType transportType,
        string performedBy,
        Guid? supplierId = null,
        Guid? bookingParticipantId = null,
        string? passengerName = null,
        DateTimeOffset? departureAt = null,
        DateTimeOffset? arrivalAt = null,
        string? ticketNumber = null,
        string? eTicketNumber = null,
        string? seatNumber = null,
        int seatCapacity = 0,
        string? seatClass = null,
        string? vehicleNumber = null,
        decimal buyPrice = 0,
        decimal taxRate = 0,
        bool isTaxable = true,
        string? fileUrl = null,
        string? specialRequest = null,
        string? note = null)
    {
        EnsureValidTimeRange(departureAt, arrivalAt);
        EnsureNonNegative(seatCapacity, nameof(seatCapacity));
        EnsureNonNegative(buyPrice, nameof(buyPrice));
        EnsureNonNegative(taxRate, nameof(taxRate));

        var totalBuyPrice = isTaxable ? buyPrice + (buyPrice * taxRate / 100) : buyPrice;

        return new BookingTransportDetailEntity
        {
            Id = Guid.CreateVersion7(),
            BookingActivityReservationId = bookingActivityReservationId,
            BookingParticipantId = bookingParticipantId,
            PassengerName = passengerName?.Trim(),
            SupplierId = supplierId,
            TransportType = transportType,
            DepartureAt = departureAt,
            ArrivalAt = arrivalAt,
            TicketNumber = ticketNumber,
            ETicketNumber = eTicketNumber,
            SeatNumber = seatNumber,
            SeatCapacity = seatCapacity,
            SeatClass = seatClass,
            VehicleNumber = vehicleNumber,
            BuyPrice = buyPrice,
            TaxRate = taxRate,
            TotalBuyPrice = totalBuyPrice,
            IsTaxable = isTaxable,
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
        TransportType transportType,
        string performedBy,
        Guid? supplierId = null,
        Guid? bookingParticipantId = null,
        string? passengerName = null,
        DateTimeOffset? departureAt = null,
        DateTimeOffset? arrivalAt = null,
        string? ticketNumber = null,
        string? eTicketNumber = null,
        string? seatNumber = null,
        int? seatCapacity = null,
        string? seatClass = null,
        string? vehicleNumber = null,
        decimal? buyPrice = null,
        decimal? taxRate = null,
        bool? isTaxable = null,
        string? fileUrl = null,
        string? specialRequest = null,
        ReservationStatus? status = null,
        string? note = null)
    {
        EnsureValidTimeRange(departureAt, arrivalAt);

        if (seatCapacity.HasValue)
        {
            EnsureNonNegative(seatCapacity.Value, nameof(seatCapacity));
            SeatCapacity = seatCapacity.Value;
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

        TransportType = transportType;
        SupplierId = supplierId;
        BookingParticipantId = bookingParticipantId;
        PassengerName = passengerName?.Trim();
        DepartureAt = departureAt;
        ArrivalAt = arrivalAt;
        TicketNumber = ticketNumber;
        ETicketNumber = eTicketNumber;
        SeatNumber = seatNumber;
        SeatClass = seatClass;
        VehicleNumber = vehicleNumber;
        IsTaxable = isTaxable ?? IsTaxable;
        TotalBuyPrice = IsTaxable ? BuyPrice + (BuyPrice * TaxRate / 100) : BuyPrice;
        FileUrl = fileUrl;
        SpecialRequest = specialRequest;
        Status = status ?? Status;
        Note = note;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    private static void EnsureValidTimeRange(DateTimeOffset? departureAt, DateTimeOffset? arrivalAt)
    {
        if (departureAt.HasValue && arrivalAt.HasValue && arrivalAt.Value <= departureAt.Value)
        {
            throw new ArgumentException("ArrivalAt phải lớn hơn DepartureAt.", nameof(arrivalAt));
        }
    }

    private static void EnsureNonNegative(decimal value, string paramName)
    {
        if (value < 0)
        {
            throw new ArgumentOutOfRangeException(paramName, "Giá trị không được âm.");
        }
    }

    private static void EnsureNonNegative(int value, string paramName)
    {
        if (value < 0)
        {
            throw new ArgumentOutOfRangeException(paramName, "Giá trị không được âm.");
        }
    }
}
