namespace Domain.Entities;

using Domain.Enums;

public class RoomBlockEntity : Aggregate<Guid>
{
    public Guid SupplierId { get; set; }
    public virtual SupplierEntity Supplier { get; set; } = null!;

    public RoomType RoomType { get; set; }
    public Guid? BookingAccommodationDetailId { get; set; }
    public virtual BookingAccommodationDetailEntity? BookingAccommodationDetail { get; set; }
    public Guid? BookingId { get; set; }

    public DateOnly BlockedDate { get; set; }
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
