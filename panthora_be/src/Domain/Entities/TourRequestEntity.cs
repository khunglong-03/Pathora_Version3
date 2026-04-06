namespace Domain.Entities;

public class TourRequestEntity : Aggregate<Guid>
{
    // Customer info
    public Guid? UserId { get; set; }
    public virtual UserEntity? User { get; set; }
    public string CustomerName { get; set; } = null!;
    public string CustomerPhone { get; set; } = null!;
    public string? CustomerEmail { get; set; }

    // Request details
    public string Destination { get; set; } = null!;
    public DateTimeOffset DepartureDate { get; set; }
    public DateTimeOffset? ReturnDate { get; set; }
    public int NumberAdult { get; set; }
    public int NumberChild { get; set; }
    public int NumberInfant { get; set; }
    public decimal? Budget { get; set; }
    public List<string> TravelInterests { get; set; } = [];
    public string? PreferredAccommodation { get; set; }
    public string? TransportationPreference { get; set; }
    public string? SpecialRequirements { get; set; }
    public string? Note { get; set; }

    // Status & review
    public TourRequestStatus Status { get; set; } = TourRequestStatus.Pending;
    public string? AdminNote { get; set; }
    public Guid? ReviewedBy { get; set; }
    public virtual UserEntity? Reviewer { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }

    // Link to approved tour instance
    public Guid? TourInstanceId { get; set; }
    public virtual TourInstanceEntity? TourInstance { get; set; }

    // Navigation
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

    public void Approve(Guid reviewedBy, string performedBy, Guid? tourInstanceId = null, string? adminNote = null)
    {
        EnsureValidTransition(Status, TourRequestStatus.Approved);
        Status = TourRequestStatus.Approved;
        ReviewedBy = reviewedBy;
        ReviewedAt = DateTimeOffset.UtcNow;
        TourInstanceId = tourInstanceId;
        AdminNote = adminNote;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Reject(Guid reviewedBy, string performedBy, string? adminNote = null)
    {
        EnsureValidTransition(Status, TourRequestStatus.Rejected);
        Status = TourRequestStatus.Rejected;
        ReviewedBy = reviewedBy;
        ReviewedAt = DateTimeOffset.UtcNow;
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
