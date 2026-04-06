namespace Domain.Entities;

public class SupplierReceiptEntity : Aggregate<Guid>
{
    public Guid SupplierPayableId { get; set; }
    public virtual SupplierPayableEntity SupplierPayable { get; set; } = null!;

    public decimal Amount { get; set; }
    public DateTimeOffset PaidAt { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public string? TransactionRef { get; set; }
    public string? Note { get; set; }

    public static SupplierReceiptEntity Create(
        Guid supplierPayableId,
        decimal amount,
        DateTimeOffset paidAt,
        PaymentMethod paymentMethod,
        string performedBy,
        string? transactionRef = null,
        string? note = null)
    {
        if (amount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(amount), "Số tiền thanh toán phải lớn hơn 0.");
        }

        return new SupplierReceiptEntity
        {
            Id = Guid.CreateVersion7(),
            SupplierPayableId = supplierPayableId,
            Amount = amount,
            PaidAt = paidAt,
            PaymentMethod = paymentMethod,
            TransactionRef = transactionRef,
            Note = note,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }
}
