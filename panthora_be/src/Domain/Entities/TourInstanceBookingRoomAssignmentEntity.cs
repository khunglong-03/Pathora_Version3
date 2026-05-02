using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Phân bổ phòng khách sạn cho từng booking trong một accommodation activity của public tour.
/// TourOperator phân bổ số phòng (đã được hotel provider duyệt và block) xuống từng booking
/// dựa trên số khách của booking đó.
/// </summary>
public class TourInstanceBookingRoomAssignmentEntity : Aggregate<Guid>
{
    public Guid TourInstanceDayActivityId { get; set; }
    public virtual TourInstanceDayActivityEntity TourInstanceDayActivity { get; set; } = null!;

    public Guid BookingId { get; set; }
    public virtual BookingEntity Booking { get; set; } = null!;

    /// <summary>Loại phòng được gán (mặc định lấy theo plan của activity).</summary>
    public RoomType RoomType { get; set; }

    /// <summary>Số phòng phân bổ cho booking này.</summary>
    public int RoomCount { get; set; }

    /// <summary>Số phòng / tên phòng cụ thể (optional, ghi sau khi check-in).</summary>
    public string? RoomNumbers { get; set; }

    /// <summary>Ghi chú yêu cầu đặc biệt.</summary>
    public string? Note { get; set; }

    public static TourInstanceBookingRoomAssignmentEntity Create(
        Guid activityId,
        Guid bookingId,
        RoomType roomType,
        int roomCount,
        string? roomNumbers,
        string? note,
        string performedBy)
    {
        if (roomCount <= 0)
            throw new ArgumentOutOfRangeException(nameof(roomCount), "RoomCount must be greater than 0.");

        return new TourInstanceBookingRoomAssignmentEntity
        {
            Id = Guid.CreateVersion7(),
            TourInstanceDayActivityId = activityId,
            BookingId = bookingId,
            RoomType = roomType,
            RoomCount = roomCount,
            RoomNumbers = roomNumbers?.Trim(),
            Note = note?.Trim(),
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        RoomType roomType,
        int roomCount,
        string? roomNumbers,
        string? note,
        string performedBy)
    {
        if (roomCount <= 0)
            throw new ArgumentOutOfRangeException(nameof(roomCount), "RoomCount must be greater than 0.");

        RoomType = roomType;
        RoomCount = roomCount;
        RoomNumbers = roomNumbers?.Trim();
        Note = note?.Trim();
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
