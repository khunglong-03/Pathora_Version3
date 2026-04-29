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
}
