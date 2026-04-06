namespace Domain.Entities;

public class VisaEntity : Aggregate<Guid>
{
    public Guid VisaApplicationId { get; set; }
    public virtual VisaApplicationEntity VisaApplication { get; set; } = null!;

    public string? VisaNumber { get; set; }
    public string? Country { get; set; }
    public VisaStatus Status { get; set; } = VisaStatus.Pending;
    public VisaEntryType? EntryType { get; set; }
    public DateTimeOffset? IssuedAt { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public string? FileUrl { get; set; }

    public static VisaEntity Create(
        Guid visaApplicationId,
        string performedBy,
        string? visaNumber = null,
        string? country = null,
        VisaStatus status = VisaStatus.Pending,
        VisaEntryType? entryType = null,
        DateTimeOffset? issuedAt = null,
        DateTimeOffset? expiresAt = null,
        string? fileUrl = null)
    {
        EnsureValidDateRange(issuedAt, expiresAt);

        return new VisaEntity
        {
            Id = Guid.CreateVersion7(),
            VisaApplicationId = visaApplicationId,
            VisaNumber = visaNumber,
            Country = country,
            Status = status,
            EntryType = entryType,
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
        string performedBy,
        string? visaNumber = null,
        string? country = null,
        VisaStatus? status = null,
        VisaEntryType? entryType = null,
        DateTimeOffset? issuedAt = null,
        DateTimeOffset? expiresAt = null,
        string? fileUrl = null)
    {
        EnsureValidDateRange(issuedAt, expiresAt);

        VisaNumber = visaNumber;
        Country = country;
        Status = status ?? Status;
        EntryType = entryType;
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
