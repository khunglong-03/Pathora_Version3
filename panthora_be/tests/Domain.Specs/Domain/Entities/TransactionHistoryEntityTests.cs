using Domain.Entities;

namespace Domain.Specs.Domain.Entities;

/// <summary><see cref="TransactionHistoryEntity.CreateCredit"/> for refund-to-wallet audit (task §7.3).</summary>
public sealed class TransactionHistoryEntityTests
{
    [Fact]
    public void CreateCredit_SetsFields()
    {
        var userId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();

        var h = TransactionHistoryEntity.CreateCredit(
            userId,
            99.5m,
            "Hoàn chênh",
            "operator-1",
            bookingId);

        Assert.NotEqual(Guid.Empty, h.Id);
        Assert.Equal(userId, h.UserId);
        Assert.Equal(bookingId, h.BookingId);
        Assert.Equal(99.5m, h.Amount);
        Assert.Equal("Hoàn chênh", h.Description);
        Assert.Equal("operator-1", h.CreatedBy);
    }

    [Fact]
    public void CreateCredit_NegativeAmount_Throws()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            TransactionHistoryEntity.CreateCredit(Guid.NewGuid(), -1m, "x", "u"));
    }

    [Fact]
    public void CreateCredit_EmptyDescription_Throws()
    {
        Assert.Throws<ArgumentException>(() =>
            TransactionHistoryEntity.CreateCredit(Guid.NewGuid(), 1m, "  ", "u"));
    }
}
