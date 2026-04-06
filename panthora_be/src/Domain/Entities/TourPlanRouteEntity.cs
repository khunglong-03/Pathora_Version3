namespace Domain.Entities;

using Domain.Entities.Translations;

public class TourPlanRouteEntity : Aggregate<Guid>
{
    public int Order { get; set; }
    public TransportationType TransportationType { get; set; }
    public string? TransportationName { get; set; }
    public string? TransportationNote { get; set; }
    public virtual TourPlanLocationEntity? FromLocation { get; set; }
    public virtual TourPlanLocationEntity? ToLocation { get; set; }
    public TimeOnly? EstimatedDepartureTime { get; set; }
    public TimeOnly? EstimatedArrivalTime { get; set; }
    public int? DurationMinutes { get; set; }
    public decimal? DistanceKm { get; set; }
    public decimal? Price { get; set; }
    public string? BookingReference { get; set; }
    public string? Note { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTimeOffset? DeletedOnUtc { get; set; }
    public string? DeletedBy { get; set; }
    public Dictionary<string, TourPlanRouteTranslationData> Translations { get; set; } = [];
    public virtual TourDayActivityEntity TourDayActivity { get; set; } = null!;

    public static TourPlanRouteEntity Create(int order, TransportationType transportationType, string performedBy, string? transportationName = null, string? transportationNote = null, TimeOnly? estimatedDepartureTime = null, TimeOnly? estimatedArrivalTime = null, int? durationMinutes = null, decimal? distanceKm = null, decimal? price = null, string? bookingReference = null, string? note = null)
    {
        EnsureValidOrder(order);
        EnsureValidTimeRange(estimatedDepartureTime, estimatedArrivalTime);
        EnsureNonNegativeValues(durationMinutes, distanceKm, price);

        return new TourPlanRouteEntity
        {
            Id = Guid.CreateVersion7(),
            Order = order,
            TransportationType = transportationType,
            TransportationName = transportationName,
            TransportationNote = transportationNote,
            EstimatedDepartureTime = estimatedDepartureTime,
            EstimatedArrivalTime = estimatedArrivalTime,
            DurationMinutes = durationMinutes,
            DistanceKm = distanceKm,
            Price = price,
            BookingReference = bookingReference,
            Note = note,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(int order, TransportationType transportationType, string performedBy, string? transportationName = null, string? transportationNote = null, TimeOnly? estimatedDepartureTime = null, TimeOnly? estimatedArrivalTime = null, int? durationMinutes = null, decimal? distanceKm = null, decimal? price = null, string? bookingReference = null, string? note = null)
    {
        EnsureValidOrder(order);
        EnsureValidTimeRange(estimatedDepartureTime, estimatedArrivalTime);
        EnsureNonNegativeValues(durationMinutes, distanceKm, price);

        Order = order;
        TransportationType = transportationType;
        TransportationName = transportationName;
        TransportationNote = transportationNote;
        EstimatedDepartureTime = estimatedDepartureTime;
        EstimatedArrivalTime = estimatedArrivalTime;
        DurationMinutes = durationMinutes;
        DistanceKm = distanceKm;
        Price = price;
        BookingReference = bookingReference;
        Note = note;
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

    private static void EnsureValidTimeRange(TimeOnly? departureTime, TimeOnly? arrivalTime)
    {
        if (departureTime.HasValue && arrivalTime.HasValue && arrivalTime.Value < departureTime.Value)
        {
            throw new ArgumentException("Arrival time must be greater than or equal to departure time.", nameof(arrivalTime));
        }
    }

    private static void EnsureNonNegativeValues(int? durationMinutes, decimal? distanceKm, decimal? price)
    {
        if (durationMinutes.HasValue && durationMinutes.Value < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(durationMinutes), "Duration minutes must be non-negative.");
        }

        if (distanceKm.HasValue && distanceKm.Value < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(distanceKm), "Distance must be non-negative.");
        }

        if (price.HasValue && price.Value < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(price), "Price must be non-negative.");
        }
    }

    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        DeletedOnUtc = DateTimeOffset.UtcNow;
        DeletedBy = performedBy;
    }
}
