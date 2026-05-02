using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Visa thực tế được cấp cho một đơn xin visa. Lưu số visa,
/// quốc gia, loại nhập cảnh, ngày cấp, ngày hết hạn, và file đính kèm.
/// </summary>
public class VisaEntity : Aggregate<Guid>
{
    /// <summary>ID của VisaApplication mà visa này được cấp.</summary>
    public Guid VisaApplicationId { get; set; }
    /// <summary>VisaApplication liên quan.</summary>
    public virtual VisaApplicationEntity VisaApplication { get; set; } = null!;
    /// <summary>Số visa (mã do Đại sứ quán cấp).</summary>
    public string? VisaNumber { get; set; }
    /// <summary>Quốc gia cấp visa.</summary>
    public string? Country { get; set; }
    /// <summary>Quốc gia được nhập cảnh.</summary>
    public string? DestinationCountry { get; set; }
    /// <summary>Mục đích visa (Du lịch, Công tác...).</summary>
    public VisaCategory? Category { get; set; }
    /// <summary>Hình thức visa (Sticker, EVisa...).</summary>
    public VisaFormat? Format { get; set; }
    /// <summary>Thời gian lưu trú tối đa (ngày).</summary>
    public int? MaxStayDays { get; set; }
    /// <summary>Cơ quan cấp visa.</summary>
    public string? IssuingAuthority { get; set; }
    /// <summary>Trạng thái: Pending, Processing, Approved, Rejected, Cancelled.</summary>
    public VisaStatus Status { get; set; } = VisaStatus.Pending;
    /// <summary>Loại nhập cảnh: Single, Double, Multiple.</summary>
    public VisaEntryType? EntryType { get; set; }
    /// <summary>Ngày cấp visa.</summary>
    public DateTimeOffset? IssuedAt { get; set; }
    /// <summary>Ngày hết hạn visa.</summary>
    public DateTimeOffset? ExpiresAt { get; set; }
    /// <summary>URL file scan visa.</summary>
    public string? FileUrl { get; set; }

    public static VisaEntity Create(
        Guid visaApplicationId,
        string performedBy,
        string? visaNumber = null,
        string? country = null,
        VisaStatus status = VisaStatus.Pending,
        VisaEntryType? entryType = null,
        DateTimeOffset? issuedAt = null,
        DateTimeOffset? expiresAt = null,
        string? fileUrl = null,
        string? destinationCountry = null,
        VisaCategory? category = null,
        VisaFormat? format = null,
        int? maxStayDays = null,
        string? issuingAuthority = null)
    {
        EnsureValidDateRange(issuedAt, expiresAt);

        return new VisaEntity
        {
            Id = Guid.CreateVersion7(),
            VisaApplicationId = visaApplicationId,
            VisaNumber = visaNumber,
            Country = country,
            DestinationCountry = destinationCountry,
            Category = category,
            Format = format,
            MaxStayDays = maxStayDays,
            IssuingAuthority = issuingAuthority,
            Status = status,
            EntryType = entryType,
            IssuedAt = issuedAt,
            ExpiresAt = expiresAt,
            FileUrl = fileUrl,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string performedBy,
        string? visaNumber = null,
        string? country = null,
        VisaStatus? status = null,
        VisaEntryType? entryType = null,
        DateTimeOffset? issuedAt = null,
        DateTimeOffset? expiresAt = null,
        string? fileUrl = null,
        string? destinationCountry = null,
        VisaCategory? category = null,
        VisaFormat? format = null,
        int? maxStayDays = null,
        string? issuingAuthority = null)
    {
        EnsureValidDateRange(issuedAt, expiresAt);

        VisaNumber = visaNumber;
        Country = country;
        DestinationCountry = destinationCountry;
        Category = category;
        Format = format;
        MaxStayDays = maxStayDays;
        IssuingAuthority = issuingAuthority;
        Status = status ?? Status;
        EntryType = entryType;
        IssuedAt = issuedAt;
        ExpiresAt = expiresAt;
        FileUrl = fileUrl;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    private static void EnsureValidDateRange(DateTimeOffset? issuedAt, DateTimeOffset? expiresAt)
    {
        if (issuedAt.HasValue && expiresAt.HasValue && expiresAt.Value <= issuedAt.Value)
        {
            throw new ArgumentException("ExpiresAt phải lớn hơn IssuedAt.", nameof(expiresAt));
        }
    }
}
