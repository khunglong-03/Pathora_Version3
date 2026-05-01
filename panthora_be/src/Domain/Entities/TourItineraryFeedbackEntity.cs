using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Bình luận / phản hồi co-design gắn một ngày cụ thể của lịch trình instance (private tour).
/// </summary>
public class TourItineraryFeedbackEntity : Aggregate<Guid>
{
    public Guid TourInstanceId { get; set; }
    public virtual TourInstanceEntity TourInstance { get; set; } = null!;

    public Guid TourInstanceDayId { get; set; }
    public virtual TourInstanceDayEntity TourInstanceDay { get; set; } = null!;

    public Guid? BookingId { get; set; }
    public virtual BookingEntity? Booking { get; set; }

    public string Content { get; set; } = null!;
    public bool IsFromCustomer { get; set; }

    public TourItineraryFeedbackStatus Status { get; set; }
    public Guid? ForwardedByManagerId { get; set; }
    public DateTimeOffset? ForwardedAt { get; set; }
    public Guid? RespondedByOperatorId { get; set; }
    public DateTimeOffset? RespondedAt { get; set; }
    public Guid? ApprovedByManagerId { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }
    public string? RejectionReason { get; set; }
    public byte[] RowVersion { get; set; } = null!;

    public static TourItineraryFeedbackEntity Create(
        Guid tourInstanceId,
        Guid tourInstanceDayId,
        string content,
        bool isFromCustomer,
        string performedBy,
        Guid? bookingId = null)
    {
        return new TourItineraryFeedbackEntity
        {
            Id = Guid.CreateVersion7(),
            TourInstanceId = tourInstanceId,
            TourInstanceDayId = tourInstanceDayId,
            BookingId = bookingId,
            Content = content,
            IsFromCustomer = isFromCustomer,
            Status = isFromCustomer ? TourItineraryFeedbackStatus.Pending : TourItineraryFeedbackStatus.ManagerApproved,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void UpdateContent(string content, string performedBy)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Nội dung không được để trống.", nameof(content));
        Content = content.Trim();
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Forward(Guid managerUserId)
    {
        if (Status != TourItineraryFeedbackStatus.Pending)
            throw new InvalidOperationException("TourItineraryFeedback.InvalidTransition");
        
        Status = TourItineraryFeedbackStatus.ManagerForwarded;
        ForwardedByManagerId = managerUserId;
        ForwardedAt = DateTimeOffset.UtcNow;
    }

    public void RecordOperatorResponse(Guid operatorUserId)
    {
        if (Status != TourItineraryFeedbackStatus.ManagerForwarded && Status != TourItineraryFeedbackStatus.ManagerRejected)
            throw new InvalidOperationException("TourItineraryFeedback.InvalidTransition");
        
        Status = TourItineraryFeedbackStatus.OperatorResponded;
        RespondedByOperatorId = operatorUserId;
        RespondedAt = DateTimeOffset.UtcNow;
    }

    public void Approve(Guid managerUserId)
    {
        if (Status != TourItineraryFeedbackStatus.OperatorResponded)
            throw new InvalidOperationException("TourItineraryFeedback.InvalidTransition");
            
        Status = TourItineraryFeedbackStatus.ManagerApproved;
        ApprovedByManagerId = managerUserId;
        ApprovedAt = DateTimeOffset.UtcNow;
    }

    public void Reject(Guid managerUserId, string? reason)
    {
        if (Status != TourItineraryFeedbackStatus.OperatorResponded)
            throw new InvalidOperationException("TourItineraryFeedback.InvalidTransition");
            
        Status = TourItineraryFeedbackStatus.ManagerRejected;
        RejectionReason = reason;
    }
}
