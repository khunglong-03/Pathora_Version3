namespace Domain.Entities;

public class SupplierPayableEntity : Aggregate<Guid>
{
    public Guid BookingId { get; set; }
    public virtual BookingEntity Booking { get; set; } = null!;
    public Guid SupplierId { get; set; }
    public virtual SupplierEntity Supplier { get; set; } = null!;

    public decimal ExpectedAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public DateTimeOffset? DueAt { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Unpaid;
    public string? Note { get; set; }

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
