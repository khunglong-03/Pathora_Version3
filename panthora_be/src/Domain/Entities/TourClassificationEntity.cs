namespace Domain.Entities;

using Domain.Entities.Translations;
using Domain.Enums;

/// <summary>
/// Một phân loại (variant) của tour — ví dụ: "3 ngày 2 đêm Tiêu chuẩn", "4 ngày 3 đêm Cao cấp".
/// Mỗi Classification thuộc về một Tour cha, có giá cơ bản riêng, số ngày/đêm riêng,
/// và chứa danh sách các TourDay (kế hoạch theo ngày) cùng các bảo hiểm áp dụng.
/// </summary>
public class TourClassificationEntity : Aggregate<Guid>
{
    /// <summary>ID của Tour cha mà Classification này thuộc về.</summary>
    public Guid TourId { get; set; }
    /// <summary>Tour cha.</summary>
    public virtual TourEntity Tour { get; set; } = null!;
    /// <summary>Tên phân loại (ví dụ: "Tiêu chuẩn", "Cao cấp", "Sang trọng").</summary>
    public string Name { get; set; } = null!;
    /// <summary>Giá cơ bản của phân loại này (tính theo giá lúc tạo instance).</summary>
    public decimal BasePrice { get; set; }
    /// <summary>Mô tả chi tiết về phân loại tour.</summary>
    public string Description { get; set; } = null!;
    /// <summary>Số ngày của tour phân loại này.</summary>
    public int NumberOfDay { get; set; }
    /// <summary>Số đêm của tour phân loại này.</summary>
    public int NumberOfNight { get; set; }
    /// <summary>Cờ xóa mềm.</summary>
    public bool IsDeleted { get; set; } = false;
    /// <summary>Timestamp xóa mềm.</summary>
    public DateTimeOffset? DeletedOnUtc { get; set; }
    /// <summary>Người thực hiện xóa.</summary>
    public string? DeletedBy { get; set; }
    /// <summary>Bản dịch đa ngôn ngữ (en/vi) cho phân loại tour.</summary>
    public Dictionary<string, TourClassificationTranslationData> Translations { get; set; } = [];
    /// <summary>Danh sách các ngày trong kế hoạch tour (TourDayEntity).</summary>
    public virtual List<TourDayEntity> Plans { get; set; } = [];
    /// <summary>Danh sách các gói bảo hiểm áp dụng cho classification này.</summary>
    public virtual List<TourInsuranceEntity> Insurances { get; set; } = [];

    public static TourClassificationEntity Create(Guid tourId, string name, decimal basePrice, string description, int numberOfDay, int numberOfNight, string performedBy)
    {
        return new TourClassificationEntity
        {
            Id = Guid.CreateVersion7(),
            TourId = tourId,
            Name = name,
            BasePrice = basePrice,
            Description = description,
            NumberOfDay = numberOfDay,
            NumberOfNight = numberOfNight,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(string name, decimal basePrice, string description, int numberOfDay, int numberOfNight, string performedBy)
    {
        Name = name;
        BasePrice = basePrice;
        Description = description;
        NumberOfDay = numberOfDay;
        NumberOfNight = numberOfNight;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        DeletedOnUtc = DateTimeOffset.UtcNow;
        DeletedBy = performedBy;
    }

    /// <summary>
    /// Recomputes <see cref="BasePrice"/> as the sum of all non-deleted activity costs across non-deleted plans.
    /// Formula per activity type:
    ///  - Transportation: Price ?? EstimatedCost ?? 0
    ///  - Accommodation:  Accommodation.RoomPrice ?? EstimatedCost ?? 0 (one room, no multiplication)
    ///  - All others:     EstimatedCost ?? 0
    /// Optional activities are included; soft-deleted plans/activities are excluded.
    /// </summary>
    public void RecalculateBasePrice()
    {
        decimal total = 0m;
        foreach (var plan in Plans)
        {
            if (plan.IsDeleted) continue;
            foreach (var activity in plan.Activities)
            {
                if (activity.IsDeleted) continue;
                total += activity.ActivityType switch
                {
                    TourDayActivityType.Transportation => activity.Price ?? activity.EstimatedCost ?? 0m,
                    TourDayActivityType.Accommodation => activity.Accommodation?.RoomPrice ?? activity.EstimatedCost ?? 0m,
                    _ => activity.EstimatedCost ?? 0m,
                };
            }
        }
        BasePrice = total;
    }
}
