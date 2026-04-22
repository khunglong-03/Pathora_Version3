namespace Domain.Entities;

using Domain.Enums;

/// <summary>
/// Yêu cầu đặt tour từ khách hàng (lead/tour request). Lưu thông tin liên hệ,
/// chi tiết chuyến đi, ngân sách, và trạng thái xử lý (Pending → Approved/Rejected/Cancelled).
/// Khi được duyệt, liên kết đến một TourInstance cụ thể.
/// </summary>
public class TourRequestEntity : Aggregate<Guid>
{
    // Customer info
    /// <summary>ID của User đã đăng nhập (null nếu khách chưa có tài khoản).</summary>
    public Guid? UserId { get; set; }
    /// <summary>User liên quan (null nếu khách vãng lai).</summary>
    public virtual UserEntity? User { get; set; }
    /// <summary>Tên khách hàng.</summary>
    public string CustomerName { get; set; } = null!;
    /// <summary>Số điện thoại khách hàng.</summary>
    public string CustomerPhone { get; set; } = null!;
    /// <summary>Email khách hàng.</summary>
    public string? CustomerEmail { get; set; }

    // Request details
    /// <summary>Điểm đến mong muốn.</summary>
    public string Destination { get; set; } = null!;
    /// <summary>Ngày khởi hành mong muốn.</summary>
    public DateTimeOffset DepartureDate { get; set; }
    /// <summary>Ngày về mong muốn (null nếu chưa xác định).</summary>
    public DateTimeOffset? ReturnDate { get; set; }
    /// <summary>Số người lớn.</summary>
    public int NumberAdult { get; set; }
    /// <summary>Số trẻ em (2–12 tuổi).</summary>
    public int NumberChild { get; set; }
    /// <summary>Số em bé (&lt;2 tuổi).</summary>
    public int NumberInfant { get; set; }
    /// <summary>Ngân sách dự kiến của khách.</summary>
    public decimal? Budget { get; set; }
    /// <summary>Danh sách sở thích du lịch (VD: ẩm thực, nghỉ dưỡng).</summary>
    public List<string> TravelInterests { get; set; } = [];
    /// <summary>Loại lưu trú ưa thích.</summary>
    public string? PreferredAccommodation { get; set; }
    /// <summary>Phương tiện di chuyển ưa thích.</summary>
    public string? TransportationPreference { get; set; }
    /// <summary>Yêu cầu đặc biệt từ khách.</summary>
    public string? SpecialRequirements { get; set; }
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }

    // Status & review
    /// <summary>Trạng thái xử lý: Pending, Approved, Rejected, Cancelled.</summary>
    public TourRequestStatus Status { get; set; } = TourRequestStatus.Pending;
    /// <summary>Ghi chú từ admin khi xử lý.</summary>
    public string? AdminNote { get; set; }
    /// <summary>ID User đã duyệt/từ chối.</summary>
    public Guid? ReviewedBy { get; set; }
    /// <summary>Admin đã review.</summary>
    public virtual UserEntity? Reviewer { get; set; }
    /// <summary>Thời gian được review.</summary>
    public DateTimeOffset? ReviewedAt { get; set; }
    /// <summary>Role của người review tại thời điểm thực hiện (snapshot).</summary>
    public string? ReviewerRole { get; set; }

    // Link to approved tour instance
    /// <summary>ID TourInstance được duyệt (null nếu chưa duyệt).</summary>
    public Guid? TourInstanceId { get; set; }
    /// <summary>TourInstance được liên kết khi duyệt.</summary>
    public virtual TourInstanceEntity? TourInstance { get; set; }

    // Navigation
    /// <summary>Danh sách các Booking tạo từ yêu cầu này.</summary>
    public virtual List<BookingEntity> Bookings { get; set; } = [];

    public static TourRequestEntity Create(
        string customerName,
        string customerPhone,
        string destination,
        DateTimeOffset departureDate,
        int numberAdult,
        string performedBy,
        Guid? userId = null,
        string? customerEmail = null,
        DateTimeOffset? returnDate = null,
        int numberChild = 0,
        int numberInfant = 0,
        decimal? budget = null,
        List<string>? travelInterests = null,
        string? preferredAccommodation = null,
        string? transportationPreference = null,
        string? specialRequirements = null,
        string? note = null)
    {
        EnsureValidParticipants(numberAdult, numberChild, numberInfant);

        return new TourRequestEntity
        {
            Id = Guid.CreateVersion7(),
            UserId = userId,
            CustomerName = customerName,
            CustomerPhone = customerPhone,
            CustomerEmail = customerEmail,
            Destination = destination,
            DepartureDate = departureDate,
            ReturnDate = returnDate,
            NumberAdult = numberAdult,
            NumberChild = numberChild,
            NumberInfant = numberInfant,
            Budget = budget,
            TravelInterests = NormalizeTravelInterests(travelInterests),
            PreferredAccommodation = preferredAccommodation,
            TransportationPreference = transportationPreference,
            SpecialRequirements = specialRequirements,
            Note = note,
            Status = TourRequestStatus.Pending,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Approve(Guid reviewedBy, string performedBy, string reviewerRole, Guid? tourInstanceId = null, string? adminNote = null)
    {
        EnsureValidTransition(Status, TourRequestStatus.Approved);
        Status = TourRequestStatus.Approved;
        ReviewedBy = reviewedBy;
        ReviewedAt = DateTimeOffset.UtcNow;
        ReviewerRole = reviewerRole;
        TourInstanceId = tourInstanceId;
        AdminNote = adminNote;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Reject(Guid reviewedBy, string performedBy, string reviewerRole, string? adminNote = null)
    {
        EnsureValidTransition(Status, TourRequestStatus.Rejected);
        Status = TourRequestStatus.Rejected;
        ReviewedBy = reviewedBy;
        ReviewedAt = DateTimeOffset.UtcNow;
        ReviewerRole = reviewerRole;
        AdminNote = adminNote;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Cancel(string performedBy)
    {
        EnsureValidTransition(Status, TourRequestStatus.Cancelled);
        Status = TourRequestStatus.Cancelled;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    private static void EnsureValidParticipants(int numberAdult, int numberChild, int numberInfant)
    {
        if (numberAdult <= 0)
            throw new ArgumentOutOfRangeException(nameof(numberAdult), "Số người lớn phải lớn hơn 0.");
        if (numberChild < 0)
            throw new ArgumentOutOfRangeException(nameof(numberChild), "Số trẻ em không được âm.");
        if (numberInfant < 0)
            throw new ArgumentOutOfRangeException(nameof(numberInfant), "Số em bé không được âm.");
    }

    private static void EnsureValidTransition(TourRequestStatus current, TourRequestStatus next)
    {
        var valid = current switch
        {
            TourRequestStatus.Pending => next is TourRequestStatus.Approved or TourRequestStatus.Rejected or TourRequestStatus.Cancelled,
            _ => false
        };

        if (!valid)
            throw new InvalidOperationException($"Không thể chuyển trạng thái từ {current} sang {next}.");
    }

    private static List<string> NormalizeTravelInterests(List<string>? travelInterests)
    {
        if (travelInterests is null || travelInterests.Count == 0)
        {
            return [];
        }

        return travelInterests
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }
}
