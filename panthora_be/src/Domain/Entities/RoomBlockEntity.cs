namespace Domain.Entities;

using Domain.Enums;

/// <summary>
/// Room block — theo dõi số phòng bị "block" (giữ chỗ) cho một booking cụ thể
/// trên một ngày nhất định. Dùng để tránh overbooking khi phòng đã được đặt
/// nhưng chưa thanh toán hoặc chưa confirm.
/// </summary>
public class RoomBlockEntity : Aggregate<Guid>
{
    /// <summary>ID nhà cung cấp lưu trú.</summary>
    public Guid SupplierId { get; set; }
    /// <summary>Nhà cung cấp lưu trú.</summary>
    public virtual SupplierEntity Supplier { get; set; } = null!;

    /// <summary>Loại phòng bị block.</summary>
    public RoomType RoomType { get; set; }
    /// <summary>ID BookingAccommodationDetail liên quan.</summary>
    public Guid? BookingAccommodationDetailId { get; set; }
    /// <summary>BookingAccommodationDetail liên quan.</summary>
    public virtual BookingAccommodationDetailEntity? BookingAccommodationDetail { get; set; }
    /// <summary>ID Booking liên quan.</summary>
    public Guid? BookingId { get; set; }

    /// <summary>Ngày phòng bị block.</summary>
    public DateOnly BlockedDate { get; set; }
    /// <summary>Số phòng bị block trong ngày này.</summary>
    public int RoomCountBlocked { get; set; }

    public static RoomBlockEntity Create(
        Guid supplierId,
        RoomType roomType,
        DateOnly blockedDate,
        int roomCountBlocked,
        string performedBy,
        Guid? bookingAccommodationDetailId = null,
        Guid? bookingId = null)
    {
        if (roomCountBlocked <= 0)
            throw new ArgumentOutOfRangeException(nameof(roomCountBlocked), "RoomCountBlocked must be greater than 0.");

        return new RoomBlockEntity
        {
            Id = Guid.CreateVersion7(),
            SupplierId = supplierId,
            RoomType = roomType,
            BookingAccommodationDetailId = bookingAccommodationDetailId,
            BookingId = bookingId,
            BlockedDate = blockedDate,
            RoomCountBlocked = roomCountBlocked,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void UpdateRoomCount(int roomCountBlocked, string performedBy)
    {
        if (roomCountBlocked <= 0)
            throw new ArgumentOutOfRangeException(nameof(roomCountBlocked), "RoomCountBlocked must be greater than 0.");

        RoomCountBlocked = roomCountBlocked;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
