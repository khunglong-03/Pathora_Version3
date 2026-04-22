namespace Domain.Entities;

using Domain.Enums;

/// <summary>
/// Phương tiện vận chuyển (xe khách, xe buýt, xe limousine...) dùng trong tour.
/// Thuộc về một chủ xe (User) và có biển số, loại xe, số ghế, khu vực hoạt động.
/// </summary>
public class VehicleEntity : Aggregate<Guid>
{
    /// <summary>Biển số xe, được chuẩn hóa in hoa khi tạo.</summary>
    public string VehiclePlate { get; set; } = null!;
    /// <summary>Loại phương tiện: Bus, Coach, Limousine, Minibus, v.v.</summary>
    public VehicleType VehicleType { get; set; }
    /// <summary>Hãng sản xuất xe (VD: Hyundai, Isuzu).</summary>
    public string? Brand { get; set; }
    /// <summary>Dòng xe cụ thể.</summary>
    public string? Model { get; set; }
    /// <summary>Số ghế ngồi (1–100).</summary>
    public int SeatCapacity { get; set; }
    /// <summary>Khu vực hoạt động: Châu Á, Châu Âu, v.v. (dùng cho lọc/tìm kiếm).</summary>
    public Continent? LocationArea { get; set; }
    /// <summary>Danh sách mã quốc gia cho phép hoạt động, phân cách bằng dấu phẩy (VD: VN, TH, KH).</summary>
    public string? OperatingCountries { get; set; }
    /// <summary>URL hình ảnh phương tiện (nhiều URL phân cách bằng dấu phẩy).</summary>
    public string? VehicleImageUrls { get; set; }
    /// <summary>ID của User sở hữu phương tiện.</summary>
    public Guid OwnerId { get; set; }
    /// <summary>Chủ sở hữu phương tiện.</summary>
    public virtual UserEntity Owner { get; set; } = null!;

    /// <summary>
    /// ER-5: the transport <see cref="SupplierEntity"/> this vehicle belongs to.
    /// Multi-supplier owners can have vehicles scoped to a specific supplier; transport
    /// approve validates <c>vehicle.SupplierId == activity.TransportSupplierId</c>, not
    /// <c>OwnerId</c>. Nullable for back-compat with existing rows.
    /// </summary>
    public Guid? SupplierId { get; set; }

    /// <summary>Supplier navigation.</summary>
    public virtual SupplierEntity? Supplier { get; set; }
    /// <summary>Trạng thái hoạt động: true = đang hoạt động, false = bị vô hiệu hóa.</summary>
    public bool IsActive { get; set; } = true;
    /// <summary>Đánh dấu đã xóa mềm.</summary>
    public bool IsDeleted { get; set; } = false;
    /// <summary>Ghi chú bổ sung về phương tiện.</summary>
    public string? Notes { get; set; }

    public static VehicleEntity Create(
        string vehiclePlate,
        VehicleType vehicleType,
        int seatCapacity,
        Guid ownerId,
        string performedBy,
        string? brand = null,
        string? model = null,
        Continent? locationArea = null,
        string? operatingCountries = null,
        string? vehicleImageUrls = null,
        string? notes = null)
    {
        EnsureValidSeatCapacity(seatCapacity);
        EnsureValidOperatingCountries(operatingCountries);

        return new VehicleEntity
        {
            Id = Guid.CreateVersion7(),
            VehiclePlate = vehiclePlate.Trim().ToUpperInvariant(),
            VehicleType = vehicleType,
            Brand = brand?.Trim(),
            Model = model?.Trim(),
            SeatCapacity = seatCapacity,
            LocationArea = locationArea,
            OperatingCountries = operatingCountries?.Trim().ToUpperInvariant(),
            VehicleImageUrls = vehicleImageUrls,
            OwnerId = ownerId,
            IsActive = true,
            IsDeleted = false,
            Notes = notes?.Trim(),
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        VehicleType vehicleType,
        string? brand,
        string? model,
        int? seatCapacity,
        Continent? locationArea,
        string? operatingCountries,
        string? vehicleImageUrls,
        string? notes,
        string performedBy)
    {
        if (seatCapacity.HasValue)
            EnsureValidSeatCapacity(seatCapacity.Value);

        if (!string.IsNullOrEmpty(operatingCountries))
            EnsureValidOperatingCountries(operatingCountries);

        VehicleType = vehicleType;
        Brand = brand?.Trim();
        Model = model?.Trim();
        SeatCapacity = seatCapacity ?? SeatCapacity;
        LocationArea = locationArea;
        OperatingCountries = operatingCountries?.Trim().ToUpperInvariant();
        VehicleImageUrls = vehicleImageUrls;
        Notes = notes?.Trim();
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Deactivate(string performedBy)
    {
        IsActive = false;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Activate(string performedBy)
    {
        IsActive = true;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    private static void EnsureValidSeatCapacity(int seatCapacity)
    {
        if (seatCapacity <= 0 || seatCapacity > 100)
        {
            throw new ArgumentOutOfRangeException(nameof(seatCapacity), "Seat capacity must be between 1 and 100.");
        }
    }

    private static void EnsureValidOperatingCountries(string? operatingCountries)
    {
        if (string.IsNullOrEmpty(operatingCountries))
            return;

        var trimmed = operatingCountries.Trim();
        if (trimmed.Length > 500)
            throw new ArgumentException("Operating countries must not exceed 500 characters.", nameof(operatingCountries));

        var codes = trimmed.Split(',', StringSplitOptions.RemoveEmptyEntries);
        if (codes.Length > 100)
            throw new ArgumentException("Operating countries must not exceed 100 country codes.", nameof(operatingCountries));

        foreach (var code in codes)
        {
            var c = code.Trim();
            if (c.Length != 2 || !c.All(char.IsLetter) || c != c.ToUpperInvariant())
                throw new ArgumentException($"Invalid country code '{c}'. Must be a 2-letter uppercase ISO code.", nameof(operatingCountries));
        }
    }
}
