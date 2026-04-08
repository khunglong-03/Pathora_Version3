namespace Domain.Entities;

using Domain.Entities.Translations;
using Domain.Enums;
using Domain.ValueObjects;

/// <summary>
/// Chính sách hủy — định nghĩa các mức phí refund khi khách hủy booking.
/// Mỗi tier chứa khoảng số ngày trước khởi hành và % phí hủy tương ứng.
/// Ví dụ: hủy 14+ ngày trước = 0% phí, 7-13 ngày = 30% phí, 3-6 ngày = 50% phí.
/// </summary>
public class CancellationPolicyEntity : Aggregate<Guid>
{
    private static int _policyCodeSequence = Random.Shared.Next(0, 1000);

    /// <summary>Mã chính sách tự sinh (format: CP-YYYYMMDD-NNN).</summary>
    public string PolicyCode { get; set; } = null!;
    /// <summary>Phạm vi: Domestic hoặc International.</summary>
    public TourScope TourScope { get; set; }
    /// <summary>Trạng thái: Active hoặc Inactive.</summary>
    public CancellationPolicyStatus Status { get; set; } = CancellationPolicyStatus.Active;
    /// <summary>Cờ xóa mềm.</summary>
    public bool IsDeleted { get; set; }

    // Translations (en, vi)
    /// <summary>Bản dịch đa ngôn ngữ.</summary>
    public Dictionary<string, CancellationPolicyTranslationData> Translations { get; set; } = [];

    /// <summary>Danh sách các tier phí hủy theo số ngày trước khởi hành.</summary>
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
