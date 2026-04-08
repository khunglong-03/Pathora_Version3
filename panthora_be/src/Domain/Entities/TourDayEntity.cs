namespace Domain.Entities;

using Domain.Entities.Translations;

/// <summary>
/// Đại diện cho một ngày trong kế hoạch tour (TourClassification).
/// Mỗi TourDay chứa các Activity (hoạt động) như tham quan, ăn uống, lưu trú,
/// và các tuyến di chuyển. Hỗ trợ đa ngôn ngữ và soft delete.
/// </summary>
public class TourDayEntity : Aggregate<Guid>
{
    /// <summary>ID của Classification cha (Tour có thể có nhiều Classification theo số ngày/mức giá).</summary>
    public Guid? ClassificationId { get; set; }
    /// <summary>Classification cha.</summary>
    public virtual TourClassificationEntity? Classification { get; set; }
    /// <summary>Số thứ tự ngày (1, 2, 3...).</summary>
    public int DayNumber { get; set; }
    /// <summary>Tiêu đề ngày (ví dụ: "Ngày 1: Khởi hành Hà Nội").</summary>
    public string Title { get; set; } = null!;
    /// <summary>Mô tả chi tiết lịch trình trong ngày.</summary>
    public string? Description { get; set; }
    /// <summary>Cờ xóa mềm.</summary>
    public bool IsDeleted { get; set; } = false;
    /// <summary>Timestamp xóa mềm.</summary>
    public DateTimeOffset? DeletedOnUtc { get; set; }
    /// <summary>Người thực hiện xóa.</summary>
    public string? DeletedBy { get; set; }
    /// <summary>Bản dịch đa ngôn ngữ (en/vi) cho title và description.</summary>
    public Dictionary<string, TourDayTranslationData> Translations { get; set; } = [];
    /// <summary>Danh sách các hoạt động trong ngày này.</summary>
    public virtual List<TourDayActivityEntity> Activities { get; set; } = [];
    /// <summary>Danh sách trạng thái hoạt động thực tế (khi tour chạy).</summary>
    public virtual List<TourDayActivityStatusEntity> ActivityStatuses { get; set; } = [];

    public static TourDayEntity Create(Guid classificationId, int dayNumber, string title, string performedBy, string? description = null)
    {
        return new TourDayEntity
        {
            Id = Guid.CreateVersion7(),
            ClassificationId = classificationId,
            DayNumber = dayNumber,
            Title = title,
            Description = description,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(int dayNumber, string title, string performedBy, string? description = null)
    {
        DayNumber = dayNumber;
        Title = title;
        Description = description;
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
