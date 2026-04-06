namespace Domain.Entities;

using Domain.Entities.Translations;
using Domain.Enums;
using Domain.ValueObjects;

public class CancellationPolicyEntity : Aggregate<Guid>
{
    private static int _policyCodeSequence = Random.Shared.Next(0, 1000);

    public string PolicyCode { get; set; } = null!;
    public TourScope TourScope { get; set; }
    public CancellationPolicyStatus Status { get; set; } = CancellationPolicyStatus.Active;
    public bool IsDeleted { get; set; }

    // Translations (en, vi)
    public Dictionary<string, CancellationPolicyTranslationData> Translations { get; set; } = [];

    public List<CancellationPolicyTier> Tiers { get; set; } = [];

    public static string GeneratePolicyCode()
    {
        var datePart = DateTimeOffset.UtcNow.ToString("yyyyMMdd");
        var sequence = Interlocked.Increment(ref _policyCodeSequence) % 1000;
        return $"CP-{datePart}-{sequence:000}";
    }

    public static CancellationPolicyEntity Create(
        TourScope tourScope,
        List<CancellationPolicyTier> tiers,
        string performedBy = "system",
        Dictionary<string, CancellationPolicyTranslationData>? translations = null)
    {
        return new CancellationPolicyEntity
        {
            Id = Guid.CreateVersion7(),
            PolicyCode = GeneratePolicyCode(),
            TourScope = tourScope,
            Tiers = tiers ?? [],
            Status = CancellationPolicyStatus.Active,
            IsDeleted = false,
            Translations = translations ?? [],
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        TourScope tourScope,
        List<CancellationPolicyTier> tiers,
        CancellationPolicyStatus status,
        string performedBy)
    {
        TourScope = tourScope;
        Tiers = tiers;
        Status = status;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Activate(string performedBy)
    {
        Status = CancellationPolicyStatus.Active;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Deactivate(string performedBy)
    {
        Status = CancellationPolicyStatus.Inactive;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public CancellationPolicyTier? FindMatchingTier(int daysBeforeDeparture)
    {
        return Tiers
            .OrderByDescending(t => t.MinDaysBeforeDeparture)
            .FirstOrDefault(t => t.MinDaysBeforeDeparture <= daysBeforeDeparture && t.MaxDaysBeforeDeparture >= daysBeforeDeparture);
    }
}
