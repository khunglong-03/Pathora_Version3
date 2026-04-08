namespace Domain.Entities;

using Domain.Entities.Translations;
using Domain.Enums;
using Domain.ValueObjects;

/// <summary>
/// Chính sách giá — định nghĩa các bậc giá (tiers) theo số lượng người tham gia
/// cho một loại tour cụ thể. Mỗi tier chứa số người tối thiểu/tối đa và mức giá tương ứng.
/// Ví dụ: 2-5 người giá X, 6-10 người giá Y.
/// </summary>
public class PricingPolicy : Aggregate<Guid>
{
    private static int _policyCodeSequence = Random.Shared.Next(0, 1000);

    /// <summary>Mã chính sách tự sinh (format: PP-YYYYMMDD-NNN).</summary>
    public string PolicyCode { get; set; } = null!;
    /// <summary>Tên chính sách giá.</summary>
    public string Name { get; set; } = null!;
    /// <summary>Loại tour mà chính sách này áp dụng: Public hoặc Private.</summary>
    public TourType TourType { get; set; }
    /// <summary>Trạng thái: Active hoặc Inactive.</summary>
    public PricingPolicyStatus Status { get; set; } = PricingPolicyStatus.Inactive;
    /// <summary>True nếu đây là chính sách mặc định.</summary>
    public bool IsDefault { get; set; }
    /// <summary>Danh sách các bậc giá (tiers) theo số người.</summary>
    public List<PricingPolicyTier> Tiers { get; set; } = [];
    /// <summary>Cờ xóa mềm.</summary>
    public bool IsDeleted { get; set; }

    // Translations (en, vi)
    /// <summary>Bản dịch đa ngôn ngữ cho chính sách giá.</summary>
    public Dictionary<string, PricingPolicyTranslationData> Translations { get; set; } = [];

    public static string GeneratePolicyCode()
    {
        var datePart = DateTimeOffset.UtcNow.ToString("yyyyMMdd");
        var sequence = Interlocked.Increment(ref _policyCodeSequence) % 1000;
        return $"PP-{datePart}-{sequence:000}";
    }

    public static PricingPolicy Create(
        string name,
        TourType tourType,
        List<PricingPolicyTier> tiers,
        bool isDefault = false,
        string performedBy = "system",
        Dictionary<string, PricingPolicyTranslationData>? translations = null)
    {
        return new PricingPolicy
        {
            Id = Guid.CreateVersion7(),
            PolicyCode = GeneratePolicyCode(),
            Name = name,
            TourType = tourType,
            Status = PricingPolicyStatus.Inactive,
            IsDefault = isDefault,
            Tiers = tiers,
            IsDeleted = false,
            Translations = translations ?? [],
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string name,
        TourType tourType,
        List<PricingPolicyTier> tiers,
        string performedBy)
    {
        Name = name;
        TourType = tourType;
        Tiers = tiers;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Activate(string performedBy)
    {
        Status = PricingPolicyStatus.Active;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Deactivate(string performedBy)
    {
        Status = PricingPolicyStatus.Inactive;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void SetStatus(PricingPolicyStatus status, string performedBy)
    {
        Status = status;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void SetAsDefault(string performedBy)
    {
        IsDefault = true;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void RemoveDefault(string performedBy)
    {
        IsDefault = false;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
