namespace Domain.Entities;

using Domain.Enums;

public class HotelRoomInventoryEntity : Aggregate<Guid>
{
    public Guid SupplierId { get; set; }
    public virtual SupplierEntity Supplier { get; set; } = null!;

    public RoomType RoomType { get; set; }
    public int TotalRooms { get; set; }

    // Geographic + descriptive fields
    public string? Name { get; set; }
    public string? Address { get; set; }
    public Continent? LocationArea { get; set; }
    public string? OperatingCountries { get; set; }
    public string? ImageUrls { get; set; }
    public string? Notes { get; set; }

    public static HotelRoomInventoryEntity Create(
        Guid supplierId,
        RoomType roomType,
        int totalRooms,
        string performedBy,
        string? name = null,
        string? address = null,
        Continent? locationArea = null,
        string? operatingCountries = null,
        string? imageUrls = null,
        string? notes = null)
    {
        if (totalRooms <= 0)
            throw new ArgumentOutOfRangeException(nameof(totalRooms), "TotalRooms must be greater than 0.");

        return new HotelRoomInventoryEntity
        {
            Id = Guid.CreateVersion7(),
            SupplierId = supplierId,
            RoomType = roomType,
            TotalRooms = totalRooms,
            Name = name?.Trim(),
            Address = address?.Trim(),
            LocationArea = locationArea,
            OperatingCountries = operatingCountries?.Trim().ToUpperInvariant(),
            ImageUrls = imageUrls,
            Notes = notes?.Trim(),
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        int? totalRooms,
        RoomType? roomType,
        string? name,
        string? address,
        Continent? locationArea,
        string? operatingCountries,
        string? imageUrls,
        string? notes,
        string performedBy)
    {
        if (totalRooms.HasValue && totalRooms.Value <= 0)
            throw new ArgumentOutOfRangeException(nameof(totalRooms), "TotalRooms must be greater than 0.");

        if (totalRooms.HasValue) TotalRooms = totalRooms.Value;
        if (roomType.HasValue) RoomType = roomType.Value;
        Name = name?.Trim();
        Address = address?.Trim();
        LocationArea = locationArea;
        OperatingCountries = operatingCountries?.Trim().ToUpperInvariant();
        ImageUrls = imageUrls;
        Notes = notes?.Trim();
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
