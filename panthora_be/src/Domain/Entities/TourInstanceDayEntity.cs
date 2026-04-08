namespace Domain.Entities;

using Domain.Entities.Translations;

/// <summary>
/// Ngày cụ thể trong một TourInstance — kết nối ngày của kế hoạch tour gốc (TourDay)
/// với một ngày thực tế trên lịch. Mỗi TourInstance có danh sách các TourInstanceDay
/// tương ứng với các ngày trong chuyến đi.
/// </summary>
public class TourInstanceDayEntity : Aggregate<Guid>
{
    /// <summary>ID của TourInstance cha.</summary>
    public Guid TourInstanceId { get; set; }
    /// <summary>TourInstance cha.</summary>
    public virtual TourInstanceEntity TourInstance { get; set; } = null!;

    /// <summary>ID của TourDay gốc (từ Classification).</summary>
    public Guid TourDayId { get; set; }
    /// <summary>TourDay gốc.</summary>
    public virtual TourDayEntity TourDay { get; set; } = null!;

    /// <summary>Số thứ tự ngày trong instance (1, 2, 3...).</summary>
    public int InstanceDayNumber { get; set; }
    /// <summary>Ngày thực tế trên lịch của ngày này.</summary>
    public DateOnly ActualDate { get; set; }
    /// <summary>Tiêu đề ngày (có thể khác với TourDay gốc).</summary>
    public string Title { get; set; } = null!;
    /// <summary>Mô tả chi tiết.</summary>
    public string? Description { get; set; }
    /// <summary>Thời gian bắt đầu.</summary>
    public TimeOnly? StartTime { get; set; }
    /// <summary>Thời gian kết thúc.</summary>
    public TimeOnly? EndTime { get; set; }
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }

    /// <summary>Bản dịch đa ngôn ngữ cho title và description.</summary>
    public Dictionary<string, TourInstanceDayTranslationData> Translations { get; set; } = [];

    public static TourInstanceDayEntity Create(
        Guid tourInstanceId,
        Guid tourDayId,
        int instanceDayNumber,
        DateOnly actualDate,
        string title,
        string performedBy,
        string? description = null,
        TimeOnly? startTime = null,
        TimeOnly? endTime = null,
        string? note = null,
        Dictionary<string, TourInstanceDayTranslationData>? translations = null)
    {
        return new TourInstanceDayEntity
        {
            Id = Guid.CreateVersion7(),
            TourInstanceId = tourInstanceId,
            TourDayId = tourDayId,
            InstanceDayNumber = instanceDayNumber,
            ActualDate = actualDate,
            Title = title,
            Description = description,
            StartTime = startTime,
            EndTime = endTime,
            Note = note,
            Translations = translations ?? [],
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string title,
        DateOnly actualDate,
        string performedBy,
        string? description = null,
        TimeOnly? startTime = null,
        TimeOnly? endTime = null,
        string? note = null,
        Dictionary<string, TourInstanceDayTranslationData>? translations = null)
    {
        Title = title;
        ActualDate = actualDate;
        Description = description;
        StartTime = startTime;
        EndTime = endTime;
        Note = note;
        if (translations is not null)
            Translations = translations;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
