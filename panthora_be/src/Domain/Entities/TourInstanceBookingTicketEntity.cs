namespace Domain.Entities;

public class TourInstanceBookingTicketEntity : Aggregate<Guid>
{
    public Guid TourInstanceDayActivityId { get; set; }
    public virtual TourInstanceDayActivityEntity TourInstanceDayActivity { get; set; } = null!;

    public Guid BookingId { get; set; }
    public virtual BookingEntity Booking { get; set; } = null!;

    public string? FlightNumber { get; set; }
    public DateTimeOffset? DepartureAt { get; set; }
    public DateTimeOffset? ArrivalAt { get; set; }
    public string? SeatNumbers { get; set; }
    public string? ETicketNumbers { get; set; }
    public string? SeatClass { get; set; }
    public string? Note { get; set; }

    public static TourInstanceBookingTicketEntity Create(
        Guid activityId,
        Guid bookingId,
        string? flightNumber,
        DateTimeOffset? departureAt,
        DateTimeOffset? arrivalAt,
        string? seatNumbers,
        string? eTicketNumbers,
        string? seatClass,
        string? note,
        string performedBy)
    {
        return new TourInstanceBookingTicketEntity
        {
            Id = Guid.CreateVersion7(),
            TourInstanceDayActivityId = activityId,
            BookingId = bookingId,
            FlightNumber = flightNumber,
            DepartureAt = departureAt,
            ArrivalAt = arrivalAt,
            SeatNumbers = seatNumbers,
            ETicketNumbers = eTicketNumbers,
            SeatClass = seatClass,
            Note = note,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string? flightNumber,
        DateTimeOffset? departureAt,
        DateTimeOffset? arrivalAt,
        string? seatNumbers,
        string? eTicketNumbers,
        string? seatClass,
        string? note,
        string performedBy)
    {
        FlightNumber = flightNumber;
        DepartureAt = departureAt;
        ArrivalAt = arrivalAt;
        SeatNumbers = seatNumbers;
        ETicketNumbers = eTicketNumbers;
        SeatClass = seatClass;
        Note = note;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
