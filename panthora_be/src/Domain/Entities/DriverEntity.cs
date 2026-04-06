namespace Domain.Entities;

using Domain.Enums;

public class DriverEntity : Aggregate<Guid>
{
    public Guid UserId { get; set; }
    public virtual UserEntity User { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public string LicenseNumber { get; set; } = null!;
    public DriverLicenseType LicenseType { get; set; }
    public string PhoneNumber { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }

    public static DriverEntity Create(
        Guid userId,
        string fullName,
        string licenseNumber,
        DriverLicenseType licenseType,
        string phoneNumber,
        string performedBy,
        string? avatarUrl = null,
        string? notes = null)
    {
        EnsureValidPhone(phoneNumber);

        return new DriverEntity
        {
            Id = Guid.CreateVersion7(),
            UserId = userId,
            FullName = fullName.Trim(),
            LicenseNumber = licenseNumber.Trim().ToUpperInvariant(),
            LicenseType = licenseType,
            PhoneNumber = phoneNumber.Trim(),
            AvatarUrl = avatarUrl?.Trim(),
            IsActive = true,
            Notes = notes?.Trim(),
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string? fullName,
        string? licenseNumber,
        DriverLicenseType? licenseType,
        string? phoneNumber,
        string? avatarUrl,
        string? notes,
        string performedBy)
    {
        if (!string.IsNullOrEmpty(phoneNumber))
            EnsureValidPhone(phoneNumber);

        FullName = fullName?.Trim() ?? FullName;
        LicenseNumber = string.IsNullOrEmpty(licenseNumber) ? LicenseNumber : licenseNumber.Trim().ToUpperInvariant();
        LicenseType = licenseType ?? LicenseType;
        PhoneNumber = string.IsNullOrEmpty(phoneNumber) ? PhoneNumber : phoneNumber.Trim();
        AvatarUrl = avatarUrl?.Trim();
        Notes = notes?.Trim();
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

    private static void EnsureValidPhone(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
        {
            throw new ArgumentException("Phone number is required.", nameof(phoneNumber));
        }
    }
}
