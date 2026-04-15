using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Chi tiết gán chỗ ở thực tế cho một hoạt động lưu trú của đợt tour.
/// </summary>
public class TourInstancePlanAccommodationEntity : Entity<Guid>
{
    public Guid TourInstanceDayActivityId { get; set; }
    public virtual TourInstanceDayActivityEntity TourInstanceDayActivity { get; set; } = null!;

    public RoomType? RoomType { get; set; }
    public int Quantity { get; set; }

    public DateTimeOffset? CheckInTime { get; set; }
    public DateTimeOffset? CheckOutTime { get; set; }

    public static TourInstancePlanAccommodationEntity Create(
        Guid tourInstanceDayActivityId,
        RoomType? roomType = null,
        int quantity = 1,
        DateTimeOffset? checkInTime = null,
        DateTimeOffset? checkOutTime = null)
    {
        return new TourInstancePlanAccommodationEntity
        {
            Id = Guid.CreateVersion7(),
            TourInstanceDayActivityId = tourInstanceDayActivityId,
            RoomType = roomType,
            Quantity = quantity,
            CheckInTime = checkInTime,
            CheckOutTime = checkOutTime
        };
    }

    public void Update(RoomType? roomType, int quantity, DateTimeOffset? checkInTime = null, DateTimeOffset? checkOutTime = null)
    {
        RoomType = roomType;
        Quantity = quantity;
        CheckInTime = checkInTime;
        CheckOutTime = checkOutTime;
    }
}
