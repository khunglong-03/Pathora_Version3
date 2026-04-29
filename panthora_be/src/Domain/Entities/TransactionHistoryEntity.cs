namespace Domain.Entities;

/// <summary>
/// Lịch sử ghi có vào ví khách (ví dụ hoàn chênh <c>FinalSellPrice</c> so với đã thanh toán). Spec OpenSpec: TransactionHistory.
/// </summary>
public class TransactionHistoryEntity : Aggregate<Guid>
{
    public Guid UserId { get; set; }
    public virtual UserEntity User { get; set; } = null!;

    public Guid? BookingId { get; set; }
    public virtual BookingEntity? Booking { get; set; }

    /// <summary>Số tiền cộng vào <see cref="UserEntity.Balance"/> (luôn &gt;= 0 cho nạp/hoàn ví).</summary>
    public decimal Amount { get; set; }

    public string Description { get; set; } = null!;

    public static TransactionHistoryEntity CreateCredit(
        Guid userId,
        decimal amount,
        string description,
        string performedBy,
        Guid? bookingId = null)
    {
        if (amount < 0)
            throw new ArgumentOutOfRangeException(nameof(amount), "Amount must be non-negative for credit entry.");
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Description is required.", nameof(description));

        return new TransactionHistoryEntity
        {
            Id = Guid.CreateVersion7(),
            UserId = userId,
            BookingId = bookingId,
            Amount = amount,
            Description = description.Trim(),
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }
}
