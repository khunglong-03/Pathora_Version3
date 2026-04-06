namespace Domain.Entities;

public class BookingParticipantEntity : Aggregate<Guid>
{
    public Guid BookingId { get; set; }
    public virtual BookingEntity Booking { get; set; } = null!;

    public string ParticipantType { get; set; } = null!;
    public string FullName { get; set; } = null!;
    public DateTimeOffset? DateOfBirth { get; set; }
    public GenderType? Gender { get; set; }
    public string? Nationality { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;

    public virtual PassportEntity? Passport { get; set; }
    public virtual List<VisaApplicationEntity> VisaApplications { get; set; } = [];

    public static BookingParticipantEntity Create(
        Guid bookingId,
        string participantType,
        string fullName,
        string performedBy,
        DateTimeOffset? dateOfBirth = null,
        GenderType? gender = null,
        string? nationality = null)
    {
        return new BookingParticipantEntity
        {
            Id = Guid.CreateVersion7(),
            BookingId = bookingId,
            ParticipantType = participantType,
            FullName = fullName,
            DateOfBirth = dateOfBirth,
            Gender = gender,
            Nationality = nationality,
            Status = ReservationStatus.Pending,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string participantType,
        string fullName,
        string performedBy,
        DateTimeOffset? dateOfBirth = null,
        GenderType? gender = null,
        string? nationality = null,
        ReservationStatus? status = null)
    {
        ParticipantType = participantType;
        FullName = fullName;
        DateOfBirth = dateOfBirth;
        Gender = gender;
        Nationality = nationality;
        Status = status ?? Status;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
