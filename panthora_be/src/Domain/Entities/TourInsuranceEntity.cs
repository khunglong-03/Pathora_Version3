namespace Domain.Entities;

using Domain.Entities.Translations;

/// <summary>
/// Gói bảo hiểm du lịch gắn với một TourClassification. Có thể bắt buộc
/// hoặc tùy chọn, bao gồm thông tin nhà cung cấp, mức bồi thường và phí.
/// </summary>
public class TourInsuranceEntity : Aggregate<Guid>
{
    /// <summary>Tên gói bảo hiểm.</summary>
    public string InsuranceName { get; set; } = null!;
    /// <summary>Loại bảo hiểm: Travel, Medical, Comprehensive.</summary>
    public InsuranceType InsuranceType { get; set; }
    /// <summary>Tên công ty bảo hiểm.</summary>
    public string InsuranceProvider { get; set; } = null!;
    /// <summary>Mô tả phạm vi bảo hiểm chi tiết.</summary>
    public string CoverageDescription { get; set; } = null!;
    /// <summary>Số tiền bồi thường tối đa.</summary>
    public decimal CoverageAmount { get; set; }
    /// <summary>Phí bảo hiểm.</summary>
    public decimal CoverageFee { get; set; }
    /// <summary>true = khách có thể chọn mua thêm; false = bắt buộc.</summary>
    public bool IsOptional { get; set; } = false;
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }
    /// <summary>Đánh dấu đã xóa mềm.</summary>
    public bool IsDeleted { get; set; } = false;
    /// <summary>Thời gian xóa mềm.</summary>
    public DateTimeOffset? DeletedOnUtc { get; set; }
    /// <summary>User đã xóa.</summary>
    public string? DeletedBy { get; set; }
    /// <summary>Bản dịch đa ngôn ngữ cho tên và mô tả.</summary>
    public Dictionary<string, TourClassificationTranslationData> Translations { get; set; } = [];
    /// <summary>ID TourClassification mà bảo hiểm này thuộc về.</summary>
    public Guid TourClassificationId { get; set; }
    /// <summary>TourClassification liên quan.</summary>
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
