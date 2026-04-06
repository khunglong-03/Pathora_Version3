namespace Domain.Entities;

using Domain.Entities.Translations;

public class TourDayEntity : Aggregate<Guid>
{
    public Guid? ClassificationId { get; set; }
    public virtual TourClassificationEntity? Classification { get; set; }
    public int DayNumber { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTimeOffset? DeletedOnUtc { get; set; }
    public string? DeletedBy { get; set; }
    public Dictionary<string, TourDayTranslationData> Translations { get; set; } = [];
    public virtual List<TourDayActivityEntity> Activities { get; set; } = [];
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
