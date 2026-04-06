namespace Domain.Entities;

using Domain.Entities.Translations;

public class TourInstanceDayEntity : Aggregate<Guid>
{
    public Guid TourInstanceId { get; set; }
    public virtual TourInstanceEntity TourInstance { get; set; } = null!;

    public Guid TourDayId { get; set; }
    public virtual TourDayEntity TourDay { get; set; } = null!;

    public int InstanceDayNumber { get; set; }
    public DateOnly ActualDate { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }
    public string? Note { get; set; }

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
