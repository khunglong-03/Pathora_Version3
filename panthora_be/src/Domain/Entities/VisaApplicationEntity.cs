namespace Domain.Entities;

public class VisaApplicationEntity : Aggregate<Guid>
{
    public Guid BookingParticipantId { get; set; }
    public virtual BookingParticipantEntity BookingParticipant { get; set; } = null!;
    public Guid PassportId { get; set; }
    public virtual PassportEntity Passport { get; set; } = null!;

    public string DestinationCountry { get; set; } = null!;
    public VisaStatus Status { get; set; } = VisaStatus.Pending;
    public DateTimeOffset? MinReturnDate { get; set; }
    public string? RefusalReason { get; set; }
    public string? VisaFileUrl { get; set; }

    public virtual VisaEntity? Visa { get; set; }

    public static VisaApplicationEntity Create(
        Guid bookingParticipantId,
        Guid passportId,
        string destinationCountry,
        string performedBy,
        DateTimeOffset? minReturnDate = null,
        string? visaFileUrl = null)
    {
        return new VisaApplicationEntity
        {
            Id = Guid.CreateVersion7(),
            BookingParticipantId = bookingParticipantId,
            PassportId = passportId,
            DestinationCountry = destinationCountry,
            Status = VisaStatus.Pending,
            MinReturnDate = minReturnDate,
            VisaFileUrl = visaFileUrl,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string destinationCountry,
        string performedBy,
        VisaStatus? status = null,
        DateTimeOffset? minReturnDate = null,
        string? refusalReason = null,
        string? visaFileUrl = null)
    {
        DestinationCountry = destinationCountry;
        Status = status ?? Status;
        MinReturnDate = minReturnDate;
        RefusalReason = refusalReason;
        VisaFileUrl = visaFileUrl;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
