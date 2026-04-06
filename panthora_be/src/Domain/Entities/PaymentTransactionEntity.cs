using System.ComponentModel.DataAnnotations;

namespace Domain.Entities;

public class PaymentTransactionEntity : Aggregate<Guid>
{
    // References
    public Guid BookingId { get; set; }
    public virtual BookingEntity Booking { get; set; } = null!;

    // Transaction identification
    public string TransactionCode { get; set; } = null!; // Mã giao dịch nội bộ
    public string? ExternalTransactionId { get; set; } // ID giao dịch từ ngân hàng/sepay
    public string? PayOSOrderCode { get; set; } // Deprecated: PayOS removed; field kept for DB compatibility

    // Transaction type & status
    public Enums.TransactionType Type { get; set; }
    public Enums.TransactionStatus Status { get; set; }

    // Amount
    public decimal Amount { get; set; }
    public decimal? PaidAmount { get; set; } // Số tiền đã thanh toán thực tế
    public decimal? RemainingAmount { get; set; } // Số tiền còn lại

    // Payment method
    public PaymentMethod PaymentMethod { get; set; }

    // Timing
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ExpiredAt { get; set; } // Hết hạn thanh toán
    public DateTimeOffset? PaidAt { get; set; } // Thời điểm thanh toán thành công
    public DateTimeOffset? CompletedAt { get; set; } // Thời điểm hoàn tất

    // Checkout info
    public string? CheckoutUrl { get; set; } // URL checkout/thanh toán
    public string? PaymentNote { get; set; } // Nội dung thanh toán (note/description)
    [MaxLength(12)]
    public string? ReferenceCode { get; set; } // Short reference code for bank matching (stored, not sent to bank)

    // Bank info (from webhook callback)
    public string? SenderName { get; set; }
    public string? SenderAccountNumber { get; set; }
    public string? BeneficiaryBank { get; set; }

    // Error tracking
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }

    // Metadata
    public int RetryCount { get; set; }
    public string? LastProcessingError { get; set; }
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
