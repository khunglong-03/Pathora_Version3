namespace Domain.Entities;

using Domain.Entities.Translations;
using Domain.Enums;

public class DepositPolicyEntity : Aggregate<Guid>
{
    public TourScope TourScope { get; set; }
    public DepositType DepositType { get; set; }
    public decimal DepositValue { get; set; }
    public int MinDaysBeforeDeparture { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }

    // Translations (en, vi)
    public Dictionary<string, DepositPolicyTranslationData> Translations { get; set; } = [];

    public static DepositPolicyEntity Create(
        TourScope tourScope,
        DepositType depositType,
        decimal depositValue,
        int minDaysBeforeDeparture,
        string performedBy,
        Dictionary<string, DepositPolicyTranslationData>? translations = null)
    {
        if (depositValue <= 0)
            throw new ArgumentOutOfRangeException(nameof(depositValue), "Deposit value must be greater than 0.");
        if (depositType == DepositType.Percentage && depositValue > 100)
            throw new ArgumentOutOfRangeException(nameof(depositValue), "Percentage deposit value cannot exceed 100.");
        if (minDaysBeforeDeparture < 0)
            throw new ArgumentOutOfRangeException(nameof(minDaysBeforeDeparture), "Min days cannot be negative.");

        return new DepositPolicyEntity
        {
            Id = Guid.CreateVersion7(),
            TourScope = tourScope,
            DepositType = depositType,
            DepositValue = depositValue,
            MinDaysBeforeDeparture = minDaysBeforeDeparture,
            IsActive = true,
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
        DepositType depositType,
        decimal depositValue,
        int minDaysBeforeDeparture,
        string performedBy)
    {
        if (depositValue <= 0)
            throw new ArgumentOutOfRangeException(nameof(depositValue), "Deposit value must be greater than 0.");
        if (depositType == DepositType.Percentage && depositValue > 100)
            throw new ArgumentOutOfRangeException(nameof(depositValue), "Percentage deposit value cannot exceed 100.");
        if (minDaysBeforeDeparture < 0)
            throw new ArgumentOutOfRangeException(nameof(minDaysBeforeDeparture), "Min days cannot be negative.");

        TourScope = tourScope;
        DepositType = depositType;
        DepositValue = depositValue;
        MinDaysBeforeDeparture = minDaysBeforeDeparture;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void SetActive(bool isActive, string performedBy)
    {
        IsActive = isActive;
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
