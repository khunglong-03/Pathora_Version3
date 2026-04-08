namespace Domain.Entities;

/// <summary>
/// Cấu hình thuế áp dụng cho booking/tour. Lưu tên thuế, tỷ lệ,
/// và ngày hiệu lực. Tự động sinh mã thuế theo format TAX-YYYYMMDD-NNN.
/// </summary>
public class TaxConfigEntity : Aggregate<Guid>
{
    private static int _taxCodeSequence = Random.Shared.Next(0, 1000);

    /// <summary>Tên loại thuế (VD: VAT 10%, Phí dịch vụ).</summary>
    public string TaxName { get; set; } = null!;
    /// <summary>Tỷ lệ thuế (VD: 0.1 = 10%).</summary>
    public decimal TaxRate { get; set; }
    /// <summary>Mô tả chi tiết về loại thuế.</summary>
    public string? Description { get; set; }
    /// <summary>Trạng thái kích hoạt: true = đang áp dụng, false = bị vô hiệu.</summary>
    public bool IsActive { get; set; }
    /// <summary>Ngày thuế bắt đầu có hiệu lực.</summary>
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
