namespace Domain.Entities;

using Domain.Enums;

public class HotelRoomInventoryEntity : Aggregate<Guid>
{
    public Guid SupplierId { get; set; }
    public virtual SupplierEntity Supplier { get; set; } = null!;

    public RoomType RoomType { get; set; }
    public int TotalRooms { get; set; }

    public static HotelRoomInventoryEntity Create(
        Guid supplierId,
        RoomType roomType,
        int totalRooms,
        string performedBy)
    {
        if (totalRooms <= 0)
            throw new ArgumentOutOfRangeException(nameof(totalRooms), "TotalRooms must be greater than 0.");

        return new HotelRoomInventoryEntity
        {
            Id = Guid.CreateVersion7(),
            SupplierId = supplierId,
            RoomType = roomType,
            TotalRooms = totalRooms,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(int totalRooms, string performedBy)
    {
        if (totalRooms <= 0)
            throw new ArgumentOutOfRangeException(nameof(totalRooms), "TotalRooms must be greater than 0.");

        TotalRooms = totalRooms;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
