namespace Domain.Entities;

using Domain.Entities.Translations;

public class TourDayActivityEntity : Aggregate<Guid>
{
    public Guid TourDayId { get; set; }
    public virtual TourDayEntity TourDay { get; set; } = null!;
    public int Order { get; set; }
    public TourDayActivityType ActivityType { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public string? Note { get; set; }
    public decimal? EstimatedCost { get; set; }
    public bool IsOptional { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTimeOffset? DeletedOnUtc { get; set; }
    public string? DeletedBy { get; set; }
    public Dictionary<string, TourDayActivityTranslationData> Translations { get; set; } = [];

    // Time
    public TimeOnly? StartTime { get; set; }
    public TimeOnly? EndTime { get; set; }

    // Route
    public virtual List<TourPlanRouteEntity> Routes { get; set; } = [];

    // Accommodation
    public virtual TourPlanAccommodationEntity? Accommodation { get; set; }

    // Resource Links
    public virtual List<TourDayActivityResourceLinkEntity> ResourceLinks { get; set; } = [];

    public static TourDayActivityEntity Create(Guid tourDayId, int order, TourDayActivityType activityType, string title, string performedBy, string? description = null, string? note = null, TimeOnly? startTime = null, TimeOnly? endTime = null, decimal? estimatedCost = null, bool isOptional = false, IEnumerable<(string Url, int Order)>? resourceLinks = null)
    {
        EnsureValidOrder(order);
        EnsureValidTimeRange(startTime, endTime);
        EnsureNonNegativeEstimatedCost(estimatedCost);

        var entity = new TourDayActivityEntity
        {
            Id = Guid.CreateVersion7(),
            TourDayId = tourDayId,
            Order = order,
            ActivityType = activityType,
            Title = title,
            Description = description,
            Note = note,
            EstimatedCost = estimatedCost,
            IsOptional = isOptional,
            StartTime = startTime,
            EndTime = endTime,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };

        if (resourceLinks != null)
        {
            foreach (var link in resourceLinks)
            {
                entity.ResourceLinks.Add(TourDayActivityResourceLinkEntity.Create(entity.Id, link.Url, link.Order, performedBy));
            }
        }

        return entity;
    }

    public void Update(int order, TourDayActivityType activityType, string title, string performedBy, string? description = null, string? note = null, TimeOnly? startTime = null, TimeOnly? endTime = null, decimal? estimatedCost = null, bool isOptional = false)
    {
        EnsureValidOrder(order);
        EnsureValidTimeRange(startTime, endTime);
        EnsureNonNegativeEstimatedCost(estimatedCost);

        Order = order;
        ActivityType = activityType;
        Title = title;
        Description = description;
        Note = note;
        EstimatedCost = estimatedCost;
        IsOptional = isOptional;
        StartTime = startTime;
        EndTime = endTime;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    private static void EnsureValidOrder(int order)
    {
        if (order <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(order), "Order must be greater than zero.");
        }
    }

    private static void EnsureValidTimeRange(TimeOnly? startTime, TimeOnly? endTime)
    {
        if (startTime.HasValue && endTime.HasValue && endTime.Value < startTime.Value)
        {
            throw new ArgumentException("End time must be greater than or equal to start time.", nameof(endTime));
        }
    }

    private static void EnsureNonNegativeEstimatedCost(decimal? estimatedCost)
    {
        if (estimatedCost.HasValue && estimatedCost.Value < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(estimatedCost), "Estimated cost must be non-negative.");
        }
    }

    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        DeletedOnUtc = DateTimeOffset.UtcNow;
        DeletedBy = performedBy;
    }
}
