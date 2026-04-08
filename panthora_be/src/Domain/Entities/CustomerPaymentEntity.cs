namespace Domain.Entities;

/// <summary>
/// Một khoản thanh toán của khách hàng thuộc một booking.
/// Có thể thuộc về một CustomerDeposit cụ thể (đợt cọc) hoặc là thanh toán trực tiếp.
/// </summary>
public class CustomerPaymentEntity : Aggregate<Guid>
{
    // Foreign keys
    /// <summary>ID của Booking.</summary>
    public Guid BookingId { get; set; }
    /// <summary>Booking cha.</summary>
    public virtual BookingEntity Booking { get; set; } = null!;
    /// <summary>ID đợt cọc mà thanh toán này thuộc về (null nếu là thanh toán khác).</summary>
    public Guid? CustomerDepositId { get; set; }
    /// <summary>Đợt cọc liên quan.</summary>
    public virtual CustomerDepositEntity? CustomerDeposit { get; set; }

    // Payment details
    /// <summary>Số tiền thanh toán.</summary>
    public decimal Amount { get; set; }
    /// <summary>Phương thức thanh toán.</summary>
    public PaymentMethod PaymentMethod { get; set; }
    /// <summary>Tham chiếu giao dịch.</summary>
    public string? TransactionRef { get; set; }
    /// <summary>Thời gian thanh toán.</summary>
    public DateTimeOffset PaidAt { get; set; }
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }

    public static CustomerPaymentEntity Create(
        Guid bookingId,
        decimal amount,
        PaymentMethod paymentMethod,
        DateTimeOffset paidAt,
        string performedBy,
        Guid? customerDepositId = null,
        string? transactionRef = null,
        string? note = null)
    {
        EnsureValidAmount(amount);

        return new CustomerPaymentEntity
        {
            Id = Guid.CreateVersion7(),
            BookingId = bookingId,
            CustomerDepositId = customerDepositId,
            Amount = amount,
            PaymentMethod = paymentMethod,
            TransactionRef = transactionRef,
            PaidAt = paidAt,
            Note = note,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    private static void EnsureValidAmount(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Số tiền thanh toán phải lớn hơn 0.");
    }
}
