namespace Domain.Entities;

using Domain.Enums;

/// <summary>
/// Thông tin tài xế. Liên kết với UserAccount và lưu trữ bằng lái,
/// loại bằng, và số điện thoại. Được phân công vào các tuyến vận chuyển.
/// </summary>
public class DriverEntity : Aggregate<Guid>
{
    /// <summary>ID của UserAccount liên kết (tài xế cũng có tài khoản trong hệ thống).</summary>
    public Guid UserId { get; set; }
    /// <summary>UserAccount của tài xế.</summary>
    public virtual UserEntity User { get; set; } = null!;
    /// <summary>Họ và tên tài xế.</summary>
    public string FullName { get; set; } = null!;
    /// <summary>Số bằng lái.</summary>
    public string LicenseNumber { get; set; } = null!;
    /// <summary>Loại bằng lái: A1, A2, B1, B2, C, v.v.</summary>
    public DriverLicenseType LicenseType { get; set; }
    /// <summary>Số điện thoại liên hệ.</summary>
    public string PhoneNumber { get; set; } = null!;
    /// <summary>URL ảnh đại diện.</summary>
    public string? AvatarUrl { get; set; }
    /// <summary>True nếu tài xế đang hoạt động.</summary>
    public bool IsActive { get; set; } = true;
    /// <summary>Ghi chú bổ sung.</summary>
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
