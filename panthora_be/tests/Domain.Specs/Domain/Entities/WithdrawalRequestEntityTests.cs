using Domain.Entities;
using Domain.Enums;

namespace Domain.Specs.Domain.Entities;

public sealed class WithdrawalRequestEntityTests
{
    [Fact]
    public void Create_ValidAmount_CreatesPendingRequest()
    {
        var w = WithdrawalRequestEntity.Create(Guid.NewGuid(), Guid.NewGuid(), 100_000m, "123", "VTB", "9704", "VietinBank", "A");
        Assert.Equal(100_000m, w.Amount);
        Assert.Equal(WithdrawalStatus.Pending, w.Status);
    }

    [Fact]
    public void Create_AmountTooLow_Throws()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => 
            WithdrawalRequestEntity.Create(Guid.NewGuid(), Guid.NewGuid(), 99_999m, "123", "VTB", "9704", "VietinBank", "A"));
    }

    [Fact]
    public void Create_AmountTooHigh_Throws()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => 
            WithdrawalRequestEntity.Create(Guid.NewGuid(), Guid.NewGuid(), 10_000_001m, "123", "VTB", "9704", "VietinBank", "A"));
    }

    [Fact]
    public void Approve_WhenPending_SetsApproved()
    {
        var w = WithdrawalRequestEntity.Create(Guid.NewGuid(), Guid.NewGuid(), 100_000m, "123", "VTB", "9704", "V", "A");
        w.Approve(Guid.NewGuid());
        Assert.Equal(WithdrawalStatus.Approved, w.Status);
        Assert.NotNull(w.ApprovedAt);
    }

    [Fact]
    public void Approve_WhenNotPending_Throws()
    {
        var w = WithdrawalRequestEntity.Create(Guid.NewGuid(), Guid.NewGuid(), 100_000m, "1", "2", "3", "4", "5");
        w.Approve(Guid.NewGuid());
        Assert.Throws<InvalidOperationException>(() => w.Approve(Guid.NewGuid()));
    }

    [Fact]
    public void Reject_WhenPending_SetsRejected()
    {
        var w = WithdrawalRequestEntity.Create(Guid.NewGuid(), Guid.NewGuid(), 100_000m, "123", "VTB", "9704", "V", "A");
        w.Reject("Not enough info");
        Assert.Equal(WithdrawalStatus.Rejected, w.Status);
        Assert.Equal("Not enough info", w.RejectionReason);
    }

    [Fact]
    public void Cancel_WhenPending_SetsCancelled()
    {
        var w = WithdrawalRequestEntity.Create(Guid.NewGuid(), Guid.NewGuid(), 100_000m, "123", "VTB", "9704", "V", "A");
        w.Cancel();
        Assert.Equal(WithdrawalStatus.Cancelled, w.Status);
    }
}
