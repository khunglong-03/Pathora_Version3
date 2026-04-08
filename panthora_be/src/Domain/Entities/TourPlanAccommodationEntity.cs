namespace Domain.Entities;

using Domain.Entities.Translations;

/// <summary>
/// Thông tin lưu trú trong kế hoạch tour. Gắn với một TourDayActivity và lưu
/// chi tiết phòng: loại phòng, số khách, giá, giờ check-in/out, bữa ăn kèm theo,
/// thông tin liên hệ khách sạn, và vị trí GPS.
/// </summary>
public class TourPlanAccommodationEntity : Aggregate<Guid>
{
    /// <summary>Tên khách sạn/lưu trú.</summary>
    public string AccommodationName { get; set; } = null!;
    /// <summary>Giờ check-in dự kiến.</summary>
    public TimeOnly? CheckInTime { get; set; }
    /// <summary>Giờ check-out dự kiến.</summary>
    public TimeOnly? CheckOutTime { get; set; }
    /// <summary>Loại phòng: Standard, Deluxe, Suite, v.v.</summary>
    public RoomType RoomType { get; set; }
    /// <summary>Số khách tối đa trong phòng.</summary>
    public int RoomCapacity { get; set; }
    /// <summary>Giá mỗi phòng mỗi đêm.</summary>
    public decimal? RoomPrice { get; set; }
    /// <summary>Số lượng phòng đặt.</summary>
    public int? NumberOfRooms { get; set; }
    /// <summary>Số đêm lưu trú.</summary>
    public int? NumberOfNights { get; set; }
    /// <summary>Tổng giá lưu trú.</summary>
    public decimal? TotalPrice { get; set; }
    /// <summary>Loại bữa ăn bao gồm: None, Breakfast, HalfBoard, FullBoard.</summary>
    public MealType MealsIncluded { get; set; }
    /// <summary>Yêu cầu đặc biệt về phòng (VD: tầng cao, không hút thuốc).</summary>
    public string? SpecialRequest { get; set; }
    /// <summary>Địa chỉ đầy đủ của khách sạn.</summary>
    public string? Address { get; set; }
    /// <summary>Thành phố của khách sạn.</summary>
    public string? City { get; set; }
    /// <summary>Số điện thoại liên hệ khách sạn.</summary>
    public string? ContactPhone { get; set; }
    /// <summary>Website khách sạn.</summary>
    public string? Website { get; set; }
    /// <summary>URL hình ảnh khách sạn.</summary>
    public string? ImageUrl { get; set; }
    /// <summary>Vĩ độ vị trí khách sạn.</summary>
    public decimal? Latitude { get; set; }
    /// <summary>Kinh độ vị trí khách sạn.</summary>
    public decimal? Longitude { get; set; }
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }
    /// <summary>Đánh dấu đã xóa mềm.</summary>
    public bool IsDeleted { get; set; } = false;
    /// <summary>Thời gian xóa mềm.</summary>
    public DateTimeOffset? DeletedOnUtc { get; set; }
    /// <summary>User đã xóa.</summary>
    public string? DeletedBy { get; set; }
    /// <summary>Bản dịch đa ngôn ngữ cho tên và mô tả.</summary>
    public Dictionary<string, TourPlanAccommodationTranslationData> Translations { get; set; } = [];
    /// <summary>ID TourDayActivity mà lưu trú này thuộc về (null nếu chỉ là template).</summary>
    public Guid? TourDayActivityId { get; set; }
    /// <summary>TourDayActivity liên quan.</summary>
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
