namespace Domain.Entities;

public class GuestArrivalParticipantEntity : Aggregate<Guid>
{
    public Guid GuestArrivalId { get; set; }
    public virtual GuestArrivalEntity GuestArrival { get; set; } = null!;

    public Guid BookingParticipantId { get; set; }
    public virtual BookingParticipantEntity BookingParticipant { get; set; } = null!;

    public static GuestArrivalParticipantEntity Create(
        Guid guestArrivalId,
        Guid bookingParticipantId,
        string performedBy)
    {
        return new GuestArrivalParticipantEntity
        {
            Id = Guid.CreateVersion7(),
            GuestArrivalId = guestArrivalId,
            BookingParticipantId = bookingParticipantId,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }
}
