namespace Domain.Entities;

using Domain.Entities.Translations;

public class TourInsuranceEntity : Aggregate<Guid>
{
    public string InsuranceName { get; set; } = null!;
    public InsuranceType InsuranceType { get; set; }
    public string InsuranceProvider { get; set; } = null!;
    public string CoverageDescription { get; set; } = null!;
    public decimal CoverageAmount { get; set; }
    public decimal CoverageFee { get; set; }
    public bool IsOptional { get; set; } = false;
    public string? Note { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTimeOffset? DeletedOnUtc { get; set; }
    public string? DeletedBy { get; set; }
    public Dictionary<string, TourClassificationTranslationData> Translations { get; set; } = [];
    public Guid TourClassificationId { get; set; }
    public virtual TourClassificationEntity TourClassification { get; set; } = null!;

    public static TourInsuranceEntity Create(string insuranceName, InsuranceType insuranceType, string insuranceProvider, string coverageDescription, decimal coverageAmount, decimal coverageFee, string performedBy, bool isOptional = false, string? note = null)
    {
        return new TourInsuranceEntity
        {
            Id = Guid.CreateVersion7(),
            InsuranceName = insuranceName,
            InsuranceType = insuranceType,
            InsuranceProvider = insuranceProvider,
            CoverageDescription = coverageDescription,
            CoverageAmount = coverageAmount,
            CoverageFee = coverageFee,
            IsOptional = isOptional,
            Note = note,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(string insuranceName, InsuranceType insuranceType, string insuranceProvider, string coverageDescription, decimal coverageAmount, decimal coverageFee, string performedBy, bool isOptional = false, string? note = null)
    {
        InsuranceName = insuranceName;
        InsuranceType = insuranceType;
        InsuranceProvider = insuranceProvider;
        CoverageDescription = coverageDescription;
        CoverageAmount = coverageAmount;
        CoverageFee = coverageFee;
        IsOptional = isOptional;
        Note = note;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        DeletedOnUtc = DateTimeOffset.UtcNow;
        DeletedBy = performedBy;
    }
}
