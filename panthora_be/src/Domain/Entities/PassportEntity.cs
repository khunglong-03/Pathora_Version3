namespace Domain.Entities;

/// <summary>
/// Passport/Hộ chiếu của một BookingParticipant. Lưu số passport,
/// quốc tịch, ngày cấp, ngày hết hạn, và file scan. Dùng để xin visa.
/// </summary>
public class PassportEntity : Aggregate<Guid>
{
    /// <summary>ID của BookingParticipant sở hữu passport.</summary>
    public Guid BookingParticipantId { get; set; }
    /// <summary>BookingParticipant liên quan.</summary>
    public virtual BookingParticipantEntity BookingParticipant { get; set; } = null!;
    /// <summary>Số passport (số hộ chiếu).</summary>
    public string PassportNumber { get; set; } = null!;
    /// <summary>Quốc tịch (VD: Vietnam, USA).</summary>
    public string? Nationality { get; set; }
    /// <summary>Ngày cấp passport.</summary>
    public DateTimeOffset? IssuedAt { get; set; }
    /// <summary>Ngày hết hạn passport.</summary>
    public DateTimeOffset? ExpiresAt { get; set; }
    /// <summary>URL file scan passport.</summary>
    public string? FileUrl { get; set; }
    /// <summary>Danh sách các đơn xin visa dùng passport này.</summary>
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
