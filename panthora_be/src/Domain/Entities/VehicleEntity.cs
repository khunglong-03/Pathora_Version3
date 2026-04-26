namespace Domain.Entities;

using Domain.Enums;

public class VehicleEntity : Aggregate<Guid>
{
    public VehicleType VehicleType { get; set; }
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public int SeatCapacity { get; set; }
    public int Quantity { get; set; } = 1;
    public Continent? LocationArea { get; set; }
    public string? OperatingCountries { get; set; }
    public string? VehicleImageUrls { get; set; }
    public Guid OwnerId { get; set; }
    public virtual UserEntity Owner { get; set; } = null!;
    public Guid? SupplierId { get; set; }
    public virtual SupplierEntity? Supplier { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public string? Notes { get; set; }

    public static VehicleEntity Create(
        VehicleType vehicleType,
        int seatCapacity,
        Guid ownerId,
        string performedBy,
        string? brand = null,
        string? model = null,
        Continent? locationArea = null,
        string? operatingCountries = null,
        string? vehicleImageUrls = null,
        string? notes = null,
        int quantity = 1)
    {
        EnsureValidSeatCapacity(seatCapacity);
        EnsureValidOperatingCountries(operatingCountries);

        return new VehicleEntity
        {
            Id = Guid.CreateVersion7(),
            VehicleType = vehicleType,
            Brand = brand?.Trim(),
            Model = model?.Trim(),
            SeatCapacity = seatCapacity,
            Quantity = quantity < 1 ? 1 : quantity,
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
        string performedBy,
        int? quantity = null)
    {
        if (seatCapacity.HasValue)
            EnsureValidSeatCapacity(seatCapacity.Value);

        if (!string.IsNullOrEmpty(operatingCountries))
            EnsureValidOperatingCountries(operatingCountries);

        VehicleType = vehicleType;
        Brand = brand?.Trim();
        Model = model?.Trim();
        SeatCapacity = seatCapacity ?? SeatCapacity;
        Quantity = quantity.HasValue && quantity.Value >= 1 ? quantity.Value : Quantity;
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
