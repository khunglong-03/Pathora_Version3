namespace Domain.Entities;

/// <summary>
/// Đợt đặt cọc của khách hàng cho một booking.
/// Một booking có thể có nhiều đợt đặt cọc (Deposit 1, Deposit 2...).
/// Mỗi đợt có số tiền dự kiến, hạn thanh toán, và trạng thái: Pending → Paid/Overdue → Waived.
/// </summary>
public class CustomerDepositEntity : Aggregate<Guid>
{
    // Foreign key
    /// <summary>ID của Booking.</summary>
    public Guid BookingId { get; set; }
    /// <summary>Booking cha.</summary>
    public virtual BookingEntity Booking { get; set; } = null!;

    // Deposit details
    /// <summary>Thứ tự đợt đặt cọc (1, 2, 3...).</summary>
    public int DepositOrder { get; set; }
    /// <summary>Số tiền cọc dự kiến.</summary>
    public decimal ExpectedAmount { get; set; }
    /// <summary>Hạn thanh toán cọc.</summary>
    public DateTimeOffset DueAt { get; set; }
    /// <summary>Trạng thái: Pending, Paid, Overdue, Waived.</summary>
    public DepositStatus Status { get; set; } = DepositStatus.Pending;
    /// <summary>Thời gian thanh toán thực tế.</summary>
    public DateTimeOffset? PaidAt { get; set; }
    /// <summary>Ghi chú bổ sung.</summary>
    public string? Note { get; set; }

    // Navigation
    /// <summary>Danh sách các khoản thanh toán thuộc đợt cọc này.</summary>
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
