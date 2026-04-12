using System.ComponentModel.DataAnnotations;

namespace Domain.Entities;

/// <summary>
/// Giao dịch thanh toán online cho booking. Quản lý toàn bộ vòng đời thanh toán:
/// tạo, gửi checkout URL, nhận webhook, xử lý retry, hoàn tiền.
/// Hỗ trợ nhiều cổng thanh toán (VNPay, MoMo, Sepay, v.v.).
/// </summary>
public class PaymentTransactionEntity : Aggregate<Guid>
{
    // References
    /// <summary>ID của Booking mà giao dịch này thuộc về.</summary>
    public Guid BookingId { get; set; }
    /// <summary>Booking cha.</summary>
    public virtual BookingEntity Booking { get; set; } = null!;

    // Transaction identification
    /// <summary>Mã giao dịch nội bộ.</summary>
    public string TransactionCode { get; set; } = null!;
    /// <summary>ID giao dịch từ cổng thanh toán (bank/sepay).</summary>
    public string? ExternalTransactionId { get; set; }
    /// <summary>Deprecated: PayOS đã bị loại bỏ.</summary>
    public string? PayOSOrderCode { get; set; }

    // Transaction type & status
    /// <summary>Loại giao dịch: Deposit, FullPayment, Refund.</summary>
    public Enums.TransactionType Type { get; set; }
    /// <summary>Trạng thái: Pending, Processing, Completed, Failed, Cancelled, Refunded.</summary>
    public Enums.TransactionStatus Status { get; set; }

    // Amount
    /// <summary>Số tiền cần thanh toán.</summary>
    public decimal Amount { get; set; }
    /// <summary>Số tiền đã thanh toán thực tế.</summary>
    public decimal? PaidAmount { get; set; }
    /// <summary>Số tiền còn lại.</summary>
    public decimal? RemainingAmount { get; set; }

    // Payment method
    /// <summary>Phương thức thanh toán: VNPay, MoMo, Sepay, BankTransfer, v.v.</summary>
    public PaymentMethod PaymentMethod { get; set; }

    // Timing
    /// <summary>Thời gian tạo giao dịch.</summary>
    public DateTimeOffset CreatedAt { get; set; }
    /// <summary>Thời gian hết hạn thanh toán.</summary>
    public DateTimeOffset? ExpiredAt { get; set; }
    /// <summary>Thời gian thanh toán thành công.</summary>
    public DateTimeOffset? PaidAt { get; set; }
    /// <summary>Thời gian hoàn tất xử lý.</summary>
    public DateTimeOffset? CompletedAt { get; set; }

    // Checkout info
    /// <summary>URL checkout để khách thanh toán.</summary>
    public string? CheckoutUrl { get; set; }
    /// <summary>Nội dung thanh toán (description/note).</summary>
    public string? PaymentNote { get; set; }
    [MaxLength(12)]
    /// <summary>Mã tham chiếu ngắn dùng để đối soát ngân hàng.</summary>
    public string? ReferenceCode { get; set; }

    // Bank info (from webhook callback)
    /// <summary>Tên người chuyển khoản.</summary>
    public string? SenderName { get; set; }
    /// <summary>Số tài khoản người chuyển.</summary>
    public string? SenderAccountNumber { get; set; }
    /// <summary>Tên ngân hàng người nhận.</summary>
    public string? BeneficiaryBank { get; set; }
    public string? ManagerAccountNumber { get; set; }
    public string? ManagerBankCode { get; set; }
    public string? ManagerAccountName { get; set; }

    // Error tracking
    /// <summary>Mã lỗi từ cổng thanh toán.</summary>
    public string? ErrorCode { get; set; }
    /// <summary>Thông điệp lỗi.</summary>
    public string? ErrorMessage { get; set; }

    // Metadata
    /// <summary>Số lần retry xử lý giao dịch.</summary>
    public int RetryCount { get; set; }
    /// <summary>Lỗi xử lý cuối cùng.</summary>
    public string? LastProcessingError { get; set; }
    /// <summary>Thời gian xử lý cuối cùng.</summary>
    public DateTimeOffset? LastProcessedAt { get; set; }

    public static PaymentTransactionEntity Create(
        Guid bookingId,
        string transactionCode,
        Enums.TransactionType type,
        decimal amount,
        PaymentMethod paymentMethod,
        string paymentNote,
        string createdBy,
        DateTimeOffset? expiredAt = null,
        string? referenceCode = null)
    {
        return new PaymentTransactionEntity
        {
            Id = Guid.CreateVersion7(),
            BookingId = bookingId,
            TransactionCode = transactionCode,
            Type = type,
            Status = Enums.TransactionStatus.Pending,
            Amount = amount,
            RemainingAmount = amount,
            PaymentMethod = paymentMethod,
            PaymentNote = paymentNote,
            ExpiredAt = expiredAt,
            CreatedAt = DateTimeOffset.UtcNow,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            CreatedBy = createdBy,
            RetryCount = 0,
            ReferenceCode = referenceCode
        };
    }

    public void MarkAsPaid(decimal paidAmount, DateTimeOffset paidAt, string? externalTransactionId = null, string? referenceCode = null)
    {
        Status = Enums.TransactionStatus.Completed;
        PaidAmount = paidAmount;
        PaidAt = paidAt;
        CompletedAt = DateTimeOffset.UtcNow;
        ExternalTransactionId = externalTransactionId;
        ReferenceCode = referenceCode ?? ReferenceCode;

        if (RemainingAmount.HasValue)
        {
            RemainingAmount = Math.Max(0, RemainingAmount.Value - paidAmount);
        }
    }

    public void MarkAsProcessing(string? errorMessage = null)
    {
        Status = Enums.TransactionStatus.Processing;
        LastProcessedAt = DateTimeOffset.UtcNow;
        if (errorMessage != null)
        {
            LastProcessingError = errorMessage;
            RetryCount++;
        }
    }

    public void MarkAsFailed(string errorCode, string errorMessage)
    {
        Status = Enums.TransactionStatus.Failed;
        ErrorCode = errorCode;
        ErrorMessage = errorMessage;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void MarkAsCancelled(string performedBy)
    {
        Status = Enums.TransactionStatus.Cancelled;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void MarkAsRefunded(string performedBy)
    {
        Status = Enums.TransactionStatus.Refunded;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public bool IsExpired()
    {
        return ExpiredAt.HasValue && ExpiredAt.Value < DateTimeOffset.UtcNow && Status == Enums.TransactionStatus.Pending;
    }

    public bool IsCompleted()
    {
        return Status == Enums.TransactionStatus.Completed;
    }
}
