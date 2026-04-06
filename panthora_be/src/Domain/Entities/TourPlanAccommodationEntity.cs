namespace Domain.Entities;

using Domain.Entities.Translations;

public class TourPlanAccommodationEntity : Aggregate<Guid>
{
    public string AccommodationName { get; set; } = null!;
    public TimeOnly? CheckInTime { get; set; }
    public TimeOnly? CheckOutTime { get; set; }
    public RoomType RoomType { get; set; }
    public int RoomCapacity { get; set; }
    public decimal? RoomPrice { get; set; }
    public int? NumberOfRooms { get; set; }
    public int? NumberOfNights { get; set; }
    public decimal? TotalPrice { get; set; }
    public MealType MealsIncluded { get; set; }
    public string? SpecialRequest { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? ContactPhone { get; set; }
    public string? Website { get; set; }
    public string? ImageUrl { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Note { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTimeOffset? DeletedOnUtc { get; set; }
    public string? DeletedBy { get; set; }
    public Dictionary<string, TourPlanAccommodationTranslationData> Translations { get; set; } = [];
    public Guid? TourDayActivityId { get; set; }
    public virtual TourDayActivityEntity TourDayActivity { get; set; } = null!;

    public static TourPlanAccommodationEntity Create(string accommodationName, RoomType roomType, int roomCapacity, MealType mealsIncluded, string performedBy, TimeOnly? checkInTime = null, TimeOnly? checkOutTime = null, decimal? roomPrice = null, int? numberOfRooms = null, int? numberOfNights = null, decimal? totalPrice = null, string? specialRequest = null, string? address = null, string? city = null, string? contactPhone = null, string? website = null, string? imageUrl = null, decimal? latitude = null, decimal? longitude = null, string? note = null, Guid? tourDayActivityId = null)
    {
        return new TourPlanAccommodationEntity
        {
            Id = Guid.CreateVersion7(),
            AccommodationName = accommodationName,
            CheckInTime = checkInTime,
            CheckOutTime = checkOutTime,
            RoomType = roomType,
            RoomCapacity = roomCapacity,
            RoomPrice = roomPrice,
            NumberOfRooms = numberOfRooms,
            NumberOfNights = numberOfNights,
            TotalPrice = totalPrice,
            MealsIncluded = mealsIncluded,
            SpecialRequest = specialRequest,
            Address = address,
            City = city,
            ContactPhone = contactPhone,
            Website = website,
            ImageUrl = imageUrl,
            Latitude = latitude,
            Longitude = longitude,
            Note = note,
            TourDayActivityId = tourDayActivityId,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(string accommodationName, RoomType roomType, int roomCapacity, MealType mealsIncluded, string performedBy, TimeOnly? checkInTime = null, TimeOnly? checkOutTime = null, decimal? roomPrice = null, int? numberOfRooms = null, int? numberOfNights = null, decimal? totalPrice = null, string? specialRequest = null, string? address = null, string? city = null, string? contactPhone = null, string? website = null, string? imageUrl = null, decimal? latitude = null, decimal? longitude = null, string? note = null)
    {
        AccommodationName = accommodationName;
        CheckInTime = checkInTime;
        CheckOutTime = checkOutTime;
        RoomType = roomType;
        RoomCapacity = roomCapacity;
        RoomPrice = roomPrice;
        NumberOfRooms = numberOfRooms;
        NumberOfNights = numberOfNights;
        TotalPrice = totalPrice;
        MealsIncluded = mealsIncluded;
        SpecialRequest = specialRequest;
        Address = address;
        City = city;
        ContactPhone = contactPhone;
        Website = website;
        ImageUrl = imageUrl;
        Latitude = latitude;
        Longitude = longitude;
        Note = note;
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
