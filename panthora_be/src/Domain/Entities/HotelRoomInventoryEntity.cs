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
    /// <summary>Ảnh đại diện khách sạn.</summary>
    public ImageEntity Thumbnail { get; set; } = new();
    /// <summary>Danh sách ảnh khách sạn.</summary>
    public List<ImageEntity> Images { get; set; } = [];
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
        ImageEntity? thumbnail = null,
        List<ImageEntity>? images = null,
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
            Thumbnail = thumbnail ?? new ImageEntity(),
            Images = images ?? [],
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
        ImageEntity? thumbnail,
        List<ImageEntity>? images,
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
        if (thumbnail is not null)
        {
            Thumbnail = new ImageEntity
            {
                FileId = thumbnail.FileId,
                OriginalFileName = thumbnail.OriginalFileName,
                FileName = thumbnail.FileName,
                PublicURL = thumbnail.PublicURL,
            };
        }
        if (images is not null)
        {
            Images.Clear();
            foreach (var img in images)
            {
                Images.Add(new ImageEntity
                {
                    FileId = img.FileId,
                    OriginalFileName = img.OriginalFileName,
                    FileName = img.FileName,
                    PublicURL = img.PublicURL,
                });
            }
        }
        Notes = notes?.Trim();
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
