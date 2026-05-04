namespace Domain.Entities;

public class BookingCancellationRequestEntity : Aggregate<Guid>
{
    public Guid BookingId { get; set; }
    public virtual BookingEntity Booking { get; set; } = null!;

    public Guid? RequestedByUserId { get; set; }

    public Guid? CancellationPolicyId { get; set; }
    public TourScope TourScopeSnapshot { get; set; }
    public int DaysBeforeDeparture { get; set; }
    public int FeePercent { get; set; }

    public decimal PaidAmountSnapshot { get; set; }
    public decimal RefundAmount { get; set; }

    public BookingCancellationRequestStatus Status { get; set; }
    public string CustomerReason { get; set; } = null!;
    public BookingStatus PreviousBookingStatus { get; set; }

    public Guid? ReviewedByManagerId { get; set; }
    public string? ManagerNote { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }

    public DateTimeOffset? RefundConfirmedAt { get; set; }
    public Guid? RefundConfirmedByManagerId { get; set; }
    public string? RefundProofNote { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public static BookingCancellationRequestEntity Create(
        Guid bookingId,
        Guid? requestedByUserId,
        Guid? cancellationPolicyId,
        TourScope tourScopeSnapshot,
        int daysBeforeDeparture,
        int feePercent,
        decimal paidAmountSnapshot,
        decimal refundAmount,
        string customerReason,
        BookingStatus previousBookingStatus,
        string performedBy)
    {
        var now = DateTimeOffset.UtcNow;

        return new BookingCancellationRequestEntity
        {
            Id = Guid.CreateVersion7(),
            BookingId = bookingId,
            RequestedByUserId = requestedByUserId,
            CancellationPolicyId = cancellationPolicyId,
            TourScopeSnapshot = tourScopeSnapshot,
            DaysBeforeDeparture = daysBeforeDeparture,
            FeePercent = feePercent,
            PaidAmountSnapshot = paidAmountSnapshot,
            RefundAmount = refundAmount,
            CustomerReason = customerReason,
            PreviousBookingStatus = previousBookingStatus,
            Status = BookingCancellationRequestStatus.PendingManagerReview,
            CreatedAt = now,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = now,
            LastModifiedOnUtc = now
        };
    }

    public void Approve(Guid managerId, string? note)
    {
        EnsurePendingReview();
        Status = BookingCancellationRequestStatus.Approved;
        ReviewedByManagerId = managerId;
        ManagerNote = note;
        ReviewedAt = DateTimeOffset.UtcNow;
        LastModifiedBy = managerId.ToString();
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Reject(Guid managerId, string? note)
    {
        EnsurePendingReview();
        Status = BookingCancellationRequestStatus.Rejected;
        ReviewedByManagerId = managerId;
        ManagerNote = note;
        ReviewedAt = DateTimeOffset.UtcNow;
        LastModifiedBy = managerId.ToString();
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void ConfirmRefundPaid(Guid managerId, string? proofNote)
    {
        if (Status != BookingCancellationRequestStatus.Approved)
            throw new InvalidOperationException("Chỉ yêu cầu đã duyệt mới được xác nhận hoàn tiền.");

        if (RefundConfirmedAt is not null)
            return;

        RefundConfirmedAt = DateTimeOffset.UtcNow;
        RefundConfirmedByManagerId = managerId;
        RefundProofNote = proofNote;
        LastModifiedBy = managerId.ToString();
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    private void EnsurePendingReview()
    {
        if (Status != BookingCancellationRequestStatus.PendingManagerReview)
            throw new InvalidOperationException("Yêu cầu hủy không còn chờ duyệt.");
    }
}
