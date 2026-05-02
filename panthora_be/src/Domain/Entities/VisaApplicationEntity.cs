namespace Domain.Entities;

using Domain.Events;

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

    // System-assisted fields
    /// <summary>True nếu khách yêu cầu hệ thống hỗ trợ tạo visa (chưa có visa sẵn).</summary>
    public bool IsSystemAssisted { get; set; }
    /// <summary>Phí dịch vụ hỗ trợ visa (do Manager báo giá).</summary>
    public decimal? ServiceFee { get; set; }
    /// <summary>ID PaymentTransaction dùng để thanh toán phí visa. Dùng để idempotent quote.</summary>
    public Guid? ServiceFeeTransactionId { get; set; }
    /// <summary>Thời điểm Manager báo giá phí visa.</summary>
    public DateTimeOffset? ServiceFeeQuotedAt { get; set; }
    /// <summary>Thời điểm khách thanh toán phí visa.</summary>
    public DateTimeOffset? ServiceFeePaidAt { get; set; }

    public static VisaApplicationEntity Create(
        Guid bookingParticipantId,
        Guid passportId,
        string destinationCountry,
        string performedBy,
        DateTimeOffset? minReturnDate = null,
        string? visaFileUrl = null,
        bool isSystemAssisted = false)
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
            IsSystemAssisted = isSystemAssisted,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    /// <summary>Khách yêu cầu hệ thống hỗ trợ làm visa.</summary>
    public void RequestSystemAssistance(string performedBy)
    {
        IsSystemAssisted = true;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    /// <summary>
    /// Manager báo giá phí hỗ trợ visa. Idempotent theo ServiceFeeTransactionId:
    /// nếu đã quote cùng transactionId thì bỏ qua, không cộng phí lần 2.
    /// </summary>
    public bool QuoteServiceFee(decimal fee, Guid transactionId, string performedBy)
    {
        if (ServiceFeeTransactionId == transactionId)
            return false; // Idempotent: đã quote với transaction này

        ServiceFee = fee;
        ServiceFeeTransactionId = transactionId;
        ServiceFeeQuotedAt = DateTimeOffset.UtcNow;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
        
        AddDomainEvent(new VisaServiceFeeQuotedEvent(Id, fee, performedBy));
        
        return true;
    }

    /// <summary>
    /// Đánh dấu phí visa đã được thanh toán. Idempotent theo ServiceFeeTransactionId.
    /// </summary>
    public bool MarkServiceFeePaid(Guid transactionId, string performedBy)
    {
        if (ServiceFeeTransactionId != transactionId)
            return false; // Transaction không khớp
        if (ServiceFeePaidAt.HasValue)
            return false; // Đã đánh dấu paid rồi

        ServiceFeePaidAt = DateTimeOffset.UtcNow;
        Status = VisaStatus.Processing;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
        return true;
    }

    public void Update(
        string destinationCountry,
        string performedBy,
        VisaStatus? status = null,
        DateTimeOffset? minReturnDate = null,
        string? refusalReason = null,
        string? visaFileUrl = null)
    {
        var oldStatus = Status;

        DestinationCountry = destinationCountry;
        Status = status ?? Status;
        MinReturnDate = minReturnDate;
        RefusalReason = refusalReason;
        VisaFileUrl = visaFileUrl;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;

        if (status.HasValue && oldStatus != status.Value)
        {
            AddDomainEvent(new VisaApplicationStatusChangedEvent(Id, oldStatus, status.Value, performedBy));
        }
    }

    /// <summary>Khách nộp lại sau khi bị Rejected: clear RefusalReason, chuyển về Pending.</summary>
    public void Resubmit(string performedBy, string? visaFileUrl = null)
    {
        if (Status != VisaStatus.Rejected)
            throw new InvalidOperationException("Chỉ có thể nộp lại đơn đã bị từ chối.");
        Status = VisaStatus.Processing;
        RefusalReason = null;
        if (visaFileUrl != null)
            VisaFileUrl = visaFileUrl;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}

