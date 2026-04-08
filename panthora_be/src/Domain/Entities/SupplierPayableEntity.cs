namespace Domain.Entities;

/// <summary>
/// Công nợ phải trả cho nhà cung cấp cho một booking.
/// Theo dõi số tiền dự kiến phải trả, đã trả, hạn thanh toán, và trạng thái.
/// Mỗi SupplierPayable có nhiều SupplierReceipt (các đợt thanh toán).
/// </summary>
public class SupplierPayableEntity : Aggregate<Guid>
{
    /// <summary>ID của Booking mà công nợ này thuộc về.</summary>
    public Guid BookingId { get; set; }
    /// <summary>Booking cha.</summary>
    public virtual BookingEntity Booking { get; set; } = null!;
    /// <summary>ID nhà cung cấp được trả.</summary>
    public Guid SupplierId { get; set; }
    /// <summary>Nhà cung cấp.</summary>
    public virtual SupplierEntity Supplier { get; set; } = null!;

    /// <summary>Số tiền dự kiến phải trả.</summary>
    public decimal ExpectedAmount { get; set; }
    /// <summary>Số tiền đã thanh toán.</summary>
    public decimal PaidAmount { get; set; }
    /// <summary>Hạn thanh toán.</summary>
    public DateTimeOffset? DueAt { get; set; }
    /// <summary>Trạng thái: Unpaid, Partial, Settled, Overpaid.</summary>
    public PaymentStatus Status { get; set; } = PaymentStatus.Unpaid;
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }

    /// <summary>Danh sách các biên nhận thanh toán cho công nợ này.</summary>
    public virtual List<SupplierReceiptEntity> Receipts { get; set; } = [];

    public static SupplierPayableEntity Create(
        Guid bookingId,
        Guid supplierId,
        decimal expectedAmount,
        string performedBy,
        DateTimeOffset? dueAt = null,
        string? note = null)
    {
        EnsureNonNegative(expectedAmount, nameof(expectedAmount));

        return new SupplierPayableEntity
        {
            Id = Guid.CreateVersion7(),
            BookingId = bookingId,
            SupplierId = supplierId,
            ExpectedAmount = expectedAmount,
            PaidAmount = 0,
            DueAt = dueAt,
            Status = PaymentStatus.Unpaid,
            Note = note,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Update(
        decimal expectedAmount,
        string performedBy,
        DateTimeOffset? dueAt = null,
        string? note = null,
        decimal? paidAmount = null)
    {
        EnsureNonNegative(expectedAmount, nameof(expectedAmount));
        ExpectedAmount = expectedAmount;

        if (paidAmount.HasValue)
        {
            EnsureNonNegative(paidAmount.Value, nameof(paidAmount));
            PaidAmount = paidAmount.Value;
        }

        DueAt = dueAt;
        Note = note;
        RecalculateStatus();
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void RecordPayment(decimal amount, string performedBy)
    {
        EnsureNonNegative(amount, nameof(amount));
        PaidAmount += amount;
        RecalculateStatus();
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    private void RecalculateStatus()
    {
        if (PaidAmount <= 0)
        {
            Status = PaymentStatus.Unpaid;
            return;
        }

        if (PaidAmount < ExpectedAmount)
        {
            Status = PaymentStatus.Partial;
            return;
        }

        if (PaidAmount == ExpectedAmount)
        {
            Status = PaymentStatus.Settled;
            return;
        }

        Status = PaymentStatus.Overpaid;
    }

    private static void EnsureNonNegative(decimal value, string paramName)
    {
        if (value < 0)
        {
            throw new ArgumentOutOfRangeException(paramName, "Giá trị không được âm.");
        }
    }
}
