namespace Domain.Entities;

using Domain.Entities.Translations;

public class TourPlanLocationEntity : Aggregate<Guid>
{
    public string LocationName { get; set; } = null!;
    public string? LocationDescription { get; set; }
    public LocationType LocationType { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal? EntranceFee { get; set; }
    public TimeOnly? OpeningHours { get; set; }
    public TimeOnly? ClosingHours { get; set; }
    public int? EstimatedDurationMinutes { get; set; }
    public string? Note { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTimeOffset? DeletedOnUtc { get; set; }
    public string? DeletedBy { get; set; }
    public Dictionary<string, TourPlanLocationTranslationData> Translations { get; set; } = [];
    public Guid? TourDayActivityId { get; set; }
    public virtual TourDayActivityEntity? TourDayActivity { get; set; }
    public Guid TourId { get; set; }
    public virtual TourEntity Tour { get; set; } = null!;

    public static TourPlanLocationEntity Create(string locationName, LocationType locationType, string performedBy, Guid tourId, string? locationDescription = null, string? address = null, string? city = null, string? country = null, decimal? latitude = null, decimal? longitude = null, decimal? entranceFee = null, TimeOnly? openingHours = null, TimeOnly? closingHours = null, int? estimatedDurationMinutes = null, string? note = null, Guid? tourDayActivityId = null)
    {
        return new TourPlanLocationEntity
        {
            Id = Guid.CreateVersion7(),
            LocationName = locationName,
            LocationDescription = locationDescription,
            LocationType = locationType,
            Address = address,
            City = city,
            Country = country,
            Latitude = latitude,
            Longitude = longitude,
            EntranceFee = entranceFee,
            OpeningHours = openingHours,
            ClosingHours = closingHours,
            EstimatedDurationMinutes = estimatedDurationMinutes,
            Note = note,
            TourId = tourId,
            TourDayActivityId = tourDayActivityId,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(string locationName, LocationType locationType, string performedBy, Guid? tourDayActivityId = null, string? locationDescription = null, string? address = null, string? city = null, string? country = null, decimal? latitude = null, decimal? longitude = null, decimal? entranceFee = null, TimeOnly? openingHours = null, TimeOnly? closingHours = null, int? estimatedDurationMinutes = null, string? note = null)
    {
        LocationName = locationName;
        LocationDescription = locationDescription;
        LocationType = locationType;
        Address = address;
        City = city;
        Country = country;
        Latitude = latitude;
        Longitude = longitude;
        EntranceFee = entranceFee;
        OpeningHours = openingHours;
        ClosingHours = closingHours;
        EstimatedDurationMinutes = estimatedDurationMinutes;
        Note = note;
        TourDayActivityId = tourDayActivityId;
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
