namespace Domain.Entities;

using Domain.Enums;

/// <summary>
/// Check-in/check-out khách tại lưu trú của booking. Gắn với một
/// BookingAccommodationDetail, theo dõi trạng thái lưu trú của nhóm
/// khách: Pending → CheckedIn → CheckedOut (hoặc NoShow).
/// </summary>
public class GuestArrivalEntity : Aggregate<Guid>
{
    /// <summary>ID của BookingAccommodationDetail mà check-in thuộc về.</summary>
    public Guid BookingAccommodationDetailId { get; set; }
    /// <summary>BookingAccommodationDetail liên quan.</summary>
    public virtual BookingAccommodationDetailEntity BookingAccommodationDetail { get; set; } = null!;
    /// <summary>ID User đã submit phiếu check-in.</summary>
    public Guid? SubmittedByUserId { get; set; }
    /// <summary>Thời gian submit phiếu check-in.</summary>
    public DateTimeOffset? SubmittedAt { get; set; }
    /// <summary>Trạng thái nộp phiếu: NotSubmitted, Submitted, Confirmed.</summary>
    public GuestArrivalSubmissionStatus SubmissionStatus { get; set; } = GuestArrivalSubmissionStatus.NotSubmitted;
    /// <summary>ID User thực hiện check-in thực tế tại khách sạn.</summary>
    public Guid? CheckedInByUserId { get; set; }
    /// <summary>Thời gian check-in thực tế.</summary>
    public DateTimeOffset? ActualCheckInAt { get; set; }
    /// <summary>ID User thực hiện check-out.</summary>
    public Guid? CheckedOutByUserId { get; set; }
    /// <summary>Thời gian check-out thực tế.</summary>
    public DateTimeOffset? ActualCheckOutAt { get; set; }
    /// <summary>Trạng thái lưu trú: Pending, CheckedIn, CheckedOut, NoShow.</summary>
    public GuestStayStatus Status { get; set; } = GuestStayStatus.Pending;
    /// <summary>Ghi chú bổ sung về việc check-in/out.</summary>
    public string? Note { get; set; }
    /// <summary>Danh sách khách trong nhóm check-in.</summary>
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
