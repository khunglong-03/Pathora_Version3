namespace Domain.Entities;

public class CustomerDepositEntity : Aggregate<Guid>
{
    // Foreign key
    public Guid BookingId { get; set; }
    public virtual BookingEntity Booking { get; set; } = null!;

    // Deposit details
    public int DepositOrder { get; set; }
    public decimal ExpectedAmount { get; set; }
    public DateTimeOffset DueAt { get; set; }
    public DepositStatus Status { get; set; } = DepositStatus.Pending;
    public DateTimeOffset? PaidAt { get; set; }
    public string? Note { get; set; }

    // Navigation
    public virtual List<CustomerPaymentEntity> Payments { get; set; } = [];

    public static CustomerDepositEntity Create(
        Guid bookingId,
        int depositOrder,
        decimal expectedAmount,
        DateTimeOffset dueAt,
        string performedBy,
        string? note = null)
    {
        EnsureValidAmount(expectedAmount);
        EnsureValidOrder(depositOrder);

        return new CustomerDepositEntity
        {
            Id = Guid.CreateVersion7(),
            BookingId = bookingId,
            DepositOrder = depositOrder,
            ExpectedAmount = expectedAmount,
            DueAt = dueAt,
            Status = DepositStatus.Pending,
            Note = note,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void MarkPaid(string performedBy)
    {
        if (Status != DepositStatus.Pending && Status != DepositStatus.Overdue)
            throw new InvalidOperationException($"Không thể đánh dấu đã thanh toán khi trạng thái là {Status}.");

        Status = DepositStatus.Paid;
        PaidAt = DateTimeOffset.UtcNow;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void MarkOverdue(string performedBy)
    {
        if (Status != DepositStatus.Pending)
            throw new InvalidOperationException("Chỉ có thể đánh dấu quá hạn khi trạng thái đang chờ.");

        Status = DepositStatus.Overdue;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    public void Waive(string performedBy)
    {
        if (Status is DepositStatus.Paid)
            throw new InvalidOperationException("Không thể miễn đợt cọc đã thanh toán.");

        Status = DepositStatus.Waived;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }

    private static void EnsureValidAmount(decimal amount)
    {
        if (amount <= 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Số tiền cọc phải lớn hơn 0.");
    }

    private static void EnsureValidOrder(int order)
    {
        if (order <= 0)
            throw new ArgumentOutOfRangeException(nameof(order), "Thứ tự đợt cọc phải lớn hơn 0.");
    }
}
