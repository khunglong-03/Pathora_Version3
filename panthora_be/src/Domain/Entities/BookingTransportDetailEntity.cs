namespace Domain.Entities;

public class BookingTransportDetailEntity : Aggregate<Guid>
{
    public Guid BookingActivityReservationId { get; set; }
    public virtual BookingActivityReservationEntity BookingActivityReservation { get; set; } = null!;
    public Guid? SupplierId { get; set; }
    public virtual SupplierEntity? Supplier { get; set; }

    public TransportType TransportType { get; set; }
    public DateTimeOffset? DepartureAt { get; set; }
    public DateTimeOffset? ArrivalAt { get; set; }
    public string? TicketNumber { get; set; }
    public string? ETicketNumber { get; set; }
    public string? SeatNumber { get; set; }
    public int SeatCapacity { get; set; }
    public string? SeatClass { get; set; }
    public string? VehicleNumber { get; set; }
    public decimal BuyPrice { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TotalBuyPrice { get; set; }
    public bool IsTaxable { get; set; }
    public string? FileUrl { get; set; }
    public string? SpecialRequest { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;
    public string? Note { get; set; }

    public static BookingTransportDetailEntity Create(
        Guid bookingActivityReservationId,
        TransportType transportType,
        string performedBy,
        Guid? supplierId = null,
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
