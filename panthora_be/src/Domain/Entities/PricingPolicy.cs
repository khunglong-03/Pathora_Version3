namespace Domain.Entities;

using Domain.Entities.Translations;
using Domain.Enums;
using Domain.ValueObjects;
// Policy xet gia khi nao
public class PricingPolicy : Aggregate<Guid>
{
    private static int _policyCodeSequence = Random.Shared.Next(0, 1000);

    public string PolicyCode { get; set; } = null!;
    public string Name { get; set; } = null!;
    public TourType TourType { get; set; }
    public PricingPolicyStatus Status { get; set; } = PricingPolicyStatus.Inactive;
    public bool IsDefault { get; set; }
    public List<PricingPolicyTier> Tiers { get; set; } = [];
    public bool IsDeleted { get; set; }

    // Translations (en, vi)
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
