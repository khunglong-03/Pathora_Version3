namespace Domain.Entities;

using Domain.Entities.Translations;

public class TourResourceEntity : Aggregate<Guid>
{
    private Guid? _fromLocationId;
    private Guid? _toLocationId;

    public Guid TourId { get; set; }
    public virtual TourEntity Tour { get; set; } = null!;

    public Guid? FromLocationId => _fromLocationId;
    public Guid? ToLocationId => _toLocationId;
    public virtual TourPlanLocationEntity? FromLocation { get; set; }
    public virtual TourPlanLocationEntity? ToLocation { get; set; }
    public TourResourceType Type { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public decimal? EntranceFee { get; set; }
    public decimal? Price { get; set; }
    public string? PricingType { get; set; }
    public string? TransportationType { get; set; }
    public string? TransportationName { get; set; }
    public int? DurationMinutes { get; set; }
    public bool RequiresIndividualTicket { get; set; }
    public string? TicketInfo { get; set; }
    public string? CheckInTime { get; set; }
    public string? CheckOutTime { get; set; }
    public string? Note { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTimeOffset? DeletedOnUtc { get; set; }
    public string? DeletedBy { get; set; }
    public Dictionary<string, TourResourceTranslationData> Translations { get; set; } = [];

    public void SetFromLocationId(Guid? id) => _fromLocationId = id;
    public void SetToLocationId(Guid? id) => _toLocationId = id;

    public static TourResourceEntity Create(
        Guid tourId,
        TourResourceType type,
        string name,
        string performedBy,
        string? description = null,
        string? address = null,
        string? city = null,
        string? country = null,
        string? contactPhone = null,
        string? contactEmail = null,
        decimal? entranceFee = null,
        decimal? price = null,
        string? pricingType = null,
        string? transportationType = null,
        string? transportationName = null,
        int? durationMinutes = null,
        bool requiresIndividualTicket = false,
        string? ticketInfo = null,
        string? checkInTime = null,
        string? checkOutTime = null,
        string? note = null,
        Guid? fromLocationId = null,
        Guid? toLocationId = null)
    {
        var entity = new TourResourceEntity
        {
            Id = Guid.CreateVersion7(),
            TourId = tourId,
            Type = type,
            Name = name,
            Description = description,
            Address = address,
            City = city,
            Country = country,
            ContactPhone = contactPhone,
            ContactEmail = contactEmail,
            EntranceFee = entranceFee,
            Price = price,
            PricingType = pricingType,
            TransportationType = transportationType,
            TransportationName = transportationName,
            DurationMinutes = durationMinutes,
            RequiresIndividualTicket = requiresIndividualTicket,
            TicketInfo = ticketInfo,
            CheckInTime = checkInTime,
            CheckOutTime = checkOutTime,
            Note = note,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
        entity.SetFromLocationId(fromLocationId);
        entity.SetToLocationId(toLocationId);
        return entity;
    }

    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        DeletedOnUtc = DateTimeOffset.UtcNow;
        DeletedBy = performedBy;
    }
}

public enum TourResourceType
{
    Accommodation,
    Location,
    Transportation,
    Service
}
