namespace Domain.Entities;

/// <summary>
/// Vé ngoài (Flight/Train/Boat/Other) — TourDesigner upload ảnh vé sau khi đã đặt vé bên ngoài.
/// Gắn vào một <see cref="TourInstanceDayActivityEntity"/> (transportation activity).
/// Có thể link tùy chọn tới một <see cref="BookingEntity"/> cụ thể (vé cá nhân) hoặc null (vé nhóm).
/// </summary>
public class TicketImageEntity : Aggregate<Guid>
{
    public Guid TourInstanceDayActivityId { get; set; }
    public virtual TourInstanceDayActivityEntity TourInstanceDayActivity { get; set; } = null!;

    /// <summary>Ảnh vé — tái dùng cấu trúc <see cref="ImageEntity"/>.</summary>
    public ImageEntity Image { get; set; } = new();

    /// <summary>UserId của TourDesigner/Manager đã upload.</summary>
    public string UploadedBy { get; set; } = null!;

    /// <summary>Thời điểm upload.</summary>
    public DateTimeOffset UploadedAt { get; set; }

    /// <summary>Booking cụ thể mà vé này gắn vào (null = vé nhóm cho cả activity).</summary>
    public Guid? BookingId { get; set; }
    public virtual BookingEntity? Booking { get; set; }

    /// <summary>Mã đặt chỗ (PNR vé máy bay, mã vé tàu, ...).</summary>
    public string? BookingReference { get; set; }

    /// <summary>Ghi chú tùy chọn.</summary>
    public string? Note { get; set; }

    public static TicketImageEntity Create(
        Guid tourInstanceDayActivityId,
        ImageEntity image,
        string uploadedBy,
        Guid? bookingId = null,
        string? bookingReference = null,
        string? note = null)
    {
        return new TicketImageEntity
        {
            Id = Guid.CreateVersion7(),
            TourInstanceDayActivityId = tourInstanceDayActivityId,
            Image = image,
            UploadedBy = uploadedBy,
            UploadedAt = DateTimeOffset.UtcNow,
            BookingId = bookingId,
            BookingReference = bookingReference,
            Note = note,
            CreatedBy = uploadedBy,
            LastModifiedBy = uploadedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow,
        };
    }
}
