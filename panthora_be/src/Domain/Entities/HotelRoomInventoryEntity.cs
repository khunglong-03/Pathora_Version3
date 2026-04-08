namespace Domain.Entities;

using Domain.Enums;

/// <summary>
/// Inventory phòng khách sạn — theo dõi số lượng phòng theo loại phòng
/// cho một nhà cung cấp lưu trú (Supplier). Dùng để quản lý tồn kho phòng
/// và kiểm tra available khi đặt BookingAccommodationDetail.
/// </summary>
public class HotelRoomInventoryEntity : Aggregate<Guid>
{
    /// <summary>ID nhà cung cấp lưu trú (khách sạn).</summary>
    public Guid SupplierId { get; set; }
    /// <summary>Nhà cung cấp lưu trú.</summary>
    public virtual SupplierEntity Supplier { get; set; } = null!;

    /// <summary>Loại phòng: Standard, Deluxe, Suite, Family, v.v.</summary>
    public RoomType RoomType { get; set; }
    /// <summary>Tổng số phòng loại này trong khách sạn.</summary>
    public int TotalRooms { get; set; }

    // Geographic + descriptive fields
    /// <summary>Tên khách sạn / cơ sở lưu trú.</summary>
    public string? Name { get; set; }
    /// <summary>Địa chỉ.</summary>
    public string? Address { get; set; }
    /// <summary>Khu vực hoạt động (châu lục).</summary>
    public Continent? LocationArea { get; set; }
    /// <summary>Danh sách quốc gia hoạt động.</summary>
    public string? OperatingCountries { get; set; }
    /// <summary>URL ảnh khách sạn.</summary>
    public string? ImageUrls { get; set; }
    /// <summary>Ghi chú bổ sung.</summary>
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
