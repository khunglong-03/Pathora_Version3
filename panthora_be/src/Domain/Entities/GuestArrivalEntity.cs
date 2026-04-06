namespace Domain.Entities;

using Domain.Enums;

public class GuestArrivalEntity : Aggregate<Guid>
{
    public Guid BookingAccommodationDetailId { get; set; }
    public virtual BookingAccommodationDetailEntity BookingAccommodationDetail { get; set; } = null!;

    public Guid? SubmittedByUserId { get; set; }
    public DateTimeOffset? SubmittedAt { get; set; }

    public GuestArrivalSubmissionStatus SubmissionStatus { get; set; } = GuestArrivalSubmissionStatus.NotSubmitted;

    public Guid? CheckedInByUserId { get; set; }
    public DateTimeOffset? ActualCheckInAt { get; set; }

    public Guid? CheckedOutByUserId { get; set; }
    public DateTimeOffset? ActualCheckOutAt { get; set; }

    public GuestStayStatus Status { get; set; } = GuestStayStatus.Pending;

    public string? Note { get; set; }

    public virtual List<GuestArrivalParticipantEntity> Participants { get; set; } = [];

    public static GuestArrivalEntity Create(
        Guid bookingAccommodationDetailId,
        Guid submittedByUserId,
        string performedBy)
    {
        return new GuestArrivalEntity
        {
            Id = Guid.CreateVersion7(),
            BookingAccommodationDetailId = bookingAccommodationDetailId,
            SubmittedByUserId = submittedByUserId,
            SubmittedAt = DateTimeOffset.UtcNow,
            SubmissionStatus = GuestArrivalSubmissionStatus.Submitted,
            Status = GuestStayStatus.Pending,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void CheckIn(Guid checkedInByUserId, string performedBy)
    {
        CheckedInByUserId = checkedInByUserId;
        ActualCheckInAt = DateTimeOffset.UtcNow;
        Status = GuestStayStatus.CheckedIn;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void CheckOut(Guid checkedOutByUserId, string performedBy)
    {
        CheckedOutByUserId = checkedOutByUserId;
        ActualCheckOutAt = DateTimeOffset.UtcNow;
        Status = GuestStayStatus.CheckedOut;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void MarkNoShow(string performedBy)
    {
        Status = GuestStayStatus.NoShow;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void UpdateSubmissionStatus(GuestArrivalSubmissionStatus status, string performedBy)
    {
        SubmissionStatus = status;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void UpdateNote(string? note, string performedBy)
    {
        Note = note;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
