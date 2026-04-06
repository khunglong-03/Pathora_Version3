namespace Domain.Entities;

public class PassportEntity : Aggregate<Guid>
{
    public Guid BookingParticipantId { get; set; }
    public virtual BookingParticipantEntity BookingParticipant { get; set; } = null!;

    public string PassportNumber { get; set; } = null!;
    public string? Nationality { get; set; }
    public DateTimeOffset? IssuedAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public string? FileUrl { get; set; }

    public virtual List<VisaApplicationEntity> VisaApplications { get; set; } = [];

    public static PassportEntity Create(
        Guid bookingParticipantId,
        string passportNumber,
        string performedBy,
        string? nationality = null,
        DateTimeOffset? issuedAt = null,
        DateTimeOffset? expiresAt = null,
        string? fileUrl = null)
    {
        EnsureValidDateRange(issuedAt, expiresAt);

        return new PassportEntity
        {
            Id = Guid.CreateVersion7(),
            BookingParticipantId = bookingParticipantId,
            PassportNumber = passportNumber,
            Nationality = nationality,
            IssuedAt = issuedAt,
            ExpiresAt = expiresAt,
            FileUrl = fileUrl,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        string passportNumber,
        string performedBy,
        string? nationality = null,
        DateTimeOffset? issuedAt = null,
        DateTimeOffset? expiresAt = null,
        string? fileUrl = null)
    {
        EnsureValidDateRange(issuedAt, expiresAt);

        PassportNumber = passportNumber;
        Nationality = nationality;
        IssuedAt = issuedAt;
        ExpiresAt = expiresAt;
        FileUrl = fileUrl;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    private static void EnsureValidDateRange(DateTimeOffset? issuedAt, DateTimeOffset? expiresAt)
    {
        if (issuedAt.HasValue && expiresAt.HasValue && expiresAt.Value <= issuedAt.Value)
        {
            throw new ArgumentException("ExpiresAt phải lớn hơn IssuedAt.", nameof(expiresAt));
        }
    }
}
