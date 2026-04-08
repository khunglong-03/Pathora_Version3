namespace Domain.Entities;

/// <summary>
/// Liên kết một khách (BookingParticipant) vào nhóm check-in/check-out
/// (GuestArrival). Mỗi GuestArrival có nhiều participant.
/// </summary>
public class GuestArrivalParticipantEntity : Aggregate<Guid>
{
    /// <summary>ID của GuestArrival chứa khách này.</summary>
    public Guid GuestArrivalId { get; set; }
    /// <summary>GuestArrival liên quan.</summary>
    public virtual GuestArrivalEntity GuestArrival { get; set; } = null!;
    /// <summary>ID của BookingParticipant được thêm vào nhóm.</summary>
    public Guid BookingParticipantId { get; set; }
    /// <summary>BookingParticipant liên quan.</summary>
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
