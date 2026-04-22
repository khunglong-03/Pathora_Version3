namespace Domain.Entities;

using Domain.Enums;

/// <summary>
/// Vehicle block — theo dõi việc giữ chỗ (block) một phương tiện cụ thể
/// trên một ngày nhất định. Dùng để tránh overbooking/overlap khi xe
/// đã được assign cho tour hoặc booking khác.
/// </summary>
public class VehicleBlockEntity : Aggregate<Guid>
{
    /// <summary>ID phương tiện bị block.</summary>
    public Guid VehicleId { get; set; }
    /// <summary>Phương tiện bị block.</summary>
    public virtual VehicleEntity Vehicle { get; set; } = null!;

    /// <summary>ID BookingActivityReservation liên quan (nếu block cho booking lẻ).</summary>
    public Guid? BookingActivityReservationId { get; set; }
    /// <summary>BookingActivityReservation liên quan.</summary>
    public virtual BookingActivityReservationEntity? BookingActivityReservation { get; set; }

    /// <summary>ID TourInstanceDayActivity liên quan (gán xe cho tour).</summary>
    public Guid? TourInstanceDayActivityId { get; set; }
    /// <summary>TourInstanceDayActivity liên quan.</summary>
    public virtual TourInstanceDayActivityEntity? TourInstanceDayActivity { get; set; }

    /// <summary>Ngày xe bị block.</summary>
    public DateOnly BlockedDate { get; set; }

    /// <summary>Trạng thái giữ chỗ (Soft/Hard).</summary>
    public HoldStatus HoldStatus { get; set; } = HoldStatus.Hard;
    /// <summary>Thời điểm hết hạn (nếu là Soft hold).</summary>
    public DateTimeOffset? ExpiresAt { get; set; }

    public static VehicleBlockEntity Create(
        Guid vehicleId,
        DateOnly blockedDate,
        string performedBy,
        Guid? tourInstanceDayActivityId = null,
        Guid? bookingActivityReservationId = null,
        HoldStatus holdStatus = HoldStatus.Hard,
        DateTimeOffset? expiresAt = null)
    {
        return new VehicleBlockEntity
        {
            Id = Guid.CreateVersion7(),
            VehicleId = vehicleId,
            BlockedDate = blockedDate,
            TourInstanceDayActivityId = tourInstanceDayActivityId,
            BookingActivityReservationId = bookingActivityReservationId,
            HoldStatus = holdStatus,
            ExpiresAt = expiresAt,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void UpdateHold(HoldStatus status, DateTimeOffset? expiresAt, string performedBy)
    {
        HoldStatus = status;
        ExpiresAt = expiresAt;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
