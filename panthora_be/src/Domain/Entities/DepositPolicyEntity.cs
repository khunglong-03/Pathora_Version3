namespace Domain.Entities;

using Domain.Entities.Translations;
using Domain.Enums;

/// <summary>
/// Chính sách đặt cọc — định nghĩa số tiền/cọc và thời hạn yêu cầu đặt cọc.
/// Ví dụ: đặt cọc 30% giá tour, phải đặt cọc trước ngày khởi hành ít nhất 7 ngày.
/// Áp dụng riêng cho tour trong nước và quốc tế.
/// </summary>
public class DepositPolicyEntity : Aggregate<Guid>
{
    /// <summary>Phạm vi: Domestic hoặc International.</summary>
    public TourScope TourScope { get; set; }
    /// <summary>Loại đặt cọc: Percentage (%) hoặc FixedAmount (số tiền cố định).</summary>
    public DepositType DepositType { get; set; }
    /// <summary>Giá trị đặt cọc (theo DepositType: % hoặc số tiền VND).</summary>
    public decimal DepositValue { get; set; }
    /// <summary>Số ngày tối thiểu trước khởi hành mà phải đặt cọc.</summary>
    public int MinDaysBeforeDeparture { get; set; }
    /// <summary>True nếu chính sách đang kích hoạt.</summary>
    public bool IsActive { get; set; } = true;
    /// <summary>Cờ xóa mềm.</summary>
    public bool IsDeleted { get; set; }

    // Translations (en, vi)
    /// <summary>Bản dịch đa ngôn ngữ.</summary>
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
