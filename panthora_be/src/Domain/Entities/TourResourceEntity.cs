namespace Domain.Entities;

using Domain.Entities.Translations;

/// <summary>
/// Tài nguyên/tiện ích trong kế hoạch tour: lưu trú, địa điểm, vận chuyển,
/// dịch vụ. Thuộc về một Tour, có thể gắn với TourPlanLocation để chỉ điểm
/// đi hoặc điểm đến. Lưu thông tin liên hệ, giá, giờ hoạt động, vé riêng.
/// </summary>
public class TourResourceEntity : Aggregate<Guid>
{
    private Guid? _fromLocationId;
    private Guid? _toLocationId;

    /// <summary>ID của Tour mà tài nguyên này thuộc về.</summary>
    public Guid TourId { get; set; }
    /// <summary>Tour liên quan.</summary>
    public virtual TourEntity Tour { get; set; } = null!;
    /// <summary>ID địa điểm bắt đầu (dùng cho loại Transportation).</summary>
    public Guid? FromLocationId => _fromLocationId;
    /// <summary>ID địa điểm kết thúc (dùng cho loại Transportation).</summary>
    public Guid? ToLocationId => _toLocationId;
    /// <summary>Địa điểm đi (null nếu loại khác).</summary>
    public virtual TourPlanLocationEntity? FromLocation { get; set; }
    /// <summary>Địa điểm đến (null nếu loại khác).</summary>
    public virtual TourPlanLocationEntity? ToLocation { get; set; }
    /// <summary>Loại tài nguyên: Accommodation, Location, Transportation, Service.</summary>
    public TourResourceType Type { get; set; }
    /// <summary>Tên tài nguyên.</summary>
    public string Name { get; set; } = null!;
    /// <summary>Mô tả chi tiết.</summary>
    public string? Description { get; set; }
    /// <summary>Địa chỉ.</summary>
    public string? Address { get; set; }
    /// <summary>Thành phố.</summary>
    public string? City { get; set; }
    /// <summary>Quốc gia.</summary>
    public string? Country { get; set; }
    /// <summary>Số điện thoại liên hệ.</summary>
    public string? ContactPhone { get; set; }
    /// <summary>Email liên hệ.</summary>
    public string? ContactEmail { get; set; }
    /// <summary>Phí vào cổng hoặc phí dịch vụ.</summary>
    public decimal? EntranceFee { get; set; }
    /// <summary>Giá tài nguyên.</summary>
    public decimal? Price { get; set; }
    /// <summary>Loại tính giá: PerPerson, PerGroup, Fixed.</summary>
    public string? PricingType { get; set; }
    /// <summary>Loại phương tiện (dùng cho Type = Transportation).</summary>
    public string? TransportationType { get; set; }
    /// <summary>Tên phương tiện cụ thể.</summary>
    public string? TransportationName { get; set; }
    /// <summary>Thời gian dự kiến sử dụng (phút).</summary>
    public int? DurationMinutes { get; set; }
    /// <summary>Có cần mua vé riêng cho từng khách hay không.</summary>
    public bool RequiresIndividualTicket { get; set; }
    /// <summary>Thông tin vé (số ghế, mã vé).</summary>
    public string? TicketInfo { get; set; }
    /// <summary>Giờ bắt đầu sử dụng tài nguyên (định dạng string).</summary>
    public string? CheckInTime { get; set; }
    /// <summary>Giờ kết thúc sử dụng tài nguyên (định dạng string).</summary>
    public string? CheckOutTime { get; set; }
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }
    /// <summary>Đánh dấu đã xóa mềm.</summary>
    public bool IsDeleted { get; set; } = false;
    /// <summary>Thời gian xóa mềm.</summary>
    public DateTimeOffset? DeletedOnUtc { get; set; }
    /// <summary>User đã xóa.</summary>
    public string? DeletedBy { get; set; }
    /// <summary>Bản dịch đa ngôn ngữ cho tên và mô tả.</summary>
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
