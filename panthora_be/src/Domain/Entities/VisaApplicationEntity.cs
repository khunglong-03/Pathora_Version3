namespace Domain.Entities;

/// <summary>
/// Đơn xin visa cho một BookingParticipant. Lưu quốc gia đích, trạng thái,
/// ngày về tối thiểu, lý do từ chối, và file đính kèm. Sau khi được cấp,
/// tạo liên kết đến VisaEntity.
/// </summary>
public class VisaApplicationEntity : Aggregate<Guid>
{
    /// <summary>ID của BookingParticipant xin visa.</summary>
    public Guid BookingParticipantId { get; set; }
    /// <summary>BookingParticipant liên quan.</summary>
    public virtual BookingParticipantEntity BookingParticipant { get; set; } = null!;
    /// <summary>ID của Passport mà đơn này dựa trên.</summary>
    public Guid PassportId { get; set; }
    /// <summary>Passport liên quan.</summary>
    public virtual PassportEntity Passport { get; set; } = null!;
    /// <summary>Quốc gia cần xin visa.</summary>
    public string DestinationCountry { get; set; } = null!;
    /// <summary>Trạng thái: Pending, Processing, Approved, Rejected, Cancelled.</summary>
    public VisaStatus Status { get; set; } = VisaStatus.Pending;
    /// <summary>Ngày về tối thiểu (visa phải có hiệu lực ít nhất đến ngày này).</summary>
    public DateTimeOffset? MinReturnDate { get; set; }
    /// <summary>Lý do từ chối nếu bị từ chối.</summary>
    public string? RefusalReason { get; set; }
    /// <summary>URL file scan passport hoặc visa đã xử lý.</summary>
    public string? VisaFileUrl { get; set; }
    /// <summary>Visa đã được cấp sau khi đơn được duyệt (null nếu chưa).</summary>
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
