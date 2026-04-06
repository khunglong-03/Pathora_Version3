namespace Domain.Entities;

public class TaxConfigEntity : Aggregate<Guid>
{
    private static int _taxCodeSequence = Random.Shared.Next(0, 1000);

    public string TaxName { get; set; } = null!;
    public decimal TaxRate { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset EffectiveDate { get; set; }

    public static string GenerateTaxCode()
    {
        var datePart = DateTimeOffset.UtcNow.ToString("yyyyMMdd");
        var sequence = Interlocked.Increment(ref _taxCodeSequence) % 1000;
        return $"TAX-{datePart}-{sequence:000}";
    }

    public static TaxConfigEntity Create(
        string taxName,
        decimal taxRate,
        string? description,
        DateTimeOffset effectiveDate,
        string performedBy)
    {
        return new TaxConfigEntity
        {
            Id = Guid.CreateVersion7(),
            TaxName = taxName,
            TaxRate = taxRate,
            Description = description,
            IsActive = true,
            EffectiveDate = effectiveDate,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string taxName,
        decimal taxRate,
        string? description,
        DateTimeOffset effectiveDate,
        string performedBy)
    {
        TaxName = taxName;
        TaxRate = taxRate;
        Description = description;
        EffectiveDate = effectiveDate;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Activate(string performedBy)
    {
        IsActive = true;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Deactivate(string performedBy)
    {
        IsActive = false;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
