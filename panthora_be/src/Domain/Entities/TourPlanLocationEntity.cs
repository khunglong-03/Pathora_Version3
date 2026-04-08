namespace Domain.Entities;

using Domain.Entities.Translations;

/// <summary>
/// Địa điểm tham quan trong kế hoạch tour. Thuộc về một Tour và có thể
/// được gắn với một TourDayActivity cụ thể. Lưu tên, loại địa điểm, địa chỉ,
/// tọa độ GPS, giờ mở cửa, và phí vào cổng.
/// </summary>
public class TourPlanLocationEntity : Aggregate<Guid>
{
    /// <summary>Tên địa điểm tham quan.</summary>
    public string LocationName { get; set; } = null!;
    /// <summary>Mô tả ngắn về địa điểm.</summary>
    public string? LocationDescription { get; set; }
    /// <summary>Loại địa điểm: TouristAttraction, Restaurant, Museum, Temple, Beach, v.v.</summary>
    public LocationType LocationType { get; set; }
    /// <summary>Địa chỉ đầy đủ.</summary>
    public string? Address { get; set; }
    /// <summary>Thành phố.</summary>
    public string? City { get; set; }
    /// <summary>Quốc gia.</summary>
    public string? Country { get; set; }
    /// <summary>Vĩ độ vị trí.</summary>
    public decimal? Latitude { get; set; }
    /// <summary>Kinh độ vị trí.</summary>
    public decimal? Longitude { get; set; }
    /// <summary>Phí vào cổng (VND).</summary>
    public decimal? EntranceFee { get; set; }
    /// <summary>Giờ mở cửa.</summary>
    public TimeOnly? OpeningHours { get; set; }
    /// <summary>Giờ đóng cửa.</summary>
    public TimeOnly? ClosingHours { get; set; }
    /// <summary>Thời gian tham quan dự kiến (phút).</summary>
    public int? EstimatedDurationMinutes { get; set; }
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }
    /// <summary>Đánh dấu đã xóa mềm.</summary>
    public bool IsDeleted { get; set; } = false;
    /// <summary>Thời gian xóa mềm.</summary>
    public DateTimeOffset? DeletedOnUtc { get; set; }
    /// <summary>User đã xóa.</summary>
    public string? DeletedBy { get; set; }
    /// <summary>Bản dịch đa ngôn ngữ cho tên và mô tả.</summary>
    public Dictionary<string, TourPlanLocationTranslationData> Translations { get; set; } = [];
    /// <summary>ID TourDayActivity mà địa điểm này gắn vào (null nếu chỉ là template).</summary>
    public Guid? TourDayActivityId { get; set; }
    /// <summary>TourDayActivity liên quan.</summary>
    public virtual TourDayActivityEntity? TourDayActivity { get; set; }
    /// <summary>ID Tour mà địa điểm thuộc về.</summary>
    public Guid TourId { get; set; }
    /// <summary>Tour liên quan.</summary>
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
