namespace Domain.Entities;

/// <summary>
/// Biên nhận thanh toán cho một SupplierPayable. Mỗi lần trả tiền cho nhà cung cấp
/// sẽ tạo một SupplierReceipt. Một SupplierPayable có thể có nhiều biên nhận (thanh toán nhiều lần).
/// </summary>
public class SupplierReceiptEntity : Aggregate<Guid>
{
    /// <summary>ID của SupplierPayable mà biên nhận này thuộc về.</summary>
    public Guid SupplierPayableId { get; set; }
    /// <summary>SupplierPayable cha.</summary>
    public virtual SupplierPayableEntity SupplierPayable { get; set; } = null!;

    /// <summary>Số tiền thanh toán trong biên nhận này.</summary>
    public decimal Amount { get; set; }
    /// <summary>Thời gian thanh toán.</summary>
    public DateTimeOffset PaidAt { get; set; }
    /// <summary>Phương thức thanh toán: chuyển khoản, tiền mặt, v.v.</summary>
    public PaymentMethod PaymentMethod { get; set; }
    /// <summary>Tham chiếu giao dịch (mã giao dịch ngân hàng).</summary>
    public string? TransactionRef { get; set; }
    /// <summary>Ghi chú bổ sung.</summary>
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
