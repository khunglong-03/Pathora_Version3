namespace Domain.Entities;

public class CustomerPaymentEntity : Aggregate<Guid>
{
    // Foreign keys
    public Guid BookingId { get; set; }
    public virtual BookingEntity Booking { get; set; } = null!;
    public Guid? CustomerDepositId { get; set; }
    public virtual CustomerDepositEntity? CustomerDeposit { get; set; }

    // Payment details
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public string? TransactionRef { get; set; }
    public DateTimeOffset PaidAt { get; set; }
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
