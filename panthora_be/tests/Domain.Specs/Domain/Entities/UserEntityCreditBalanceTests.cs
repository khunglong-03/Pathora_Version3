using Domain.Entities;

namespace Domain.Specs.Domain.Entities;

/// <summary>Wallet credit used when Delta &lt; 0 on private tour settlement (task §7.3).</summary>
public sealed class UserEntityCreditBalanceTests
{
    [Fact]
    public void CreditBalance_AddsToBalance()
    {
        var u = UserEntity.Create("a", "A", "a@b.com", "hash", "seed");
        u.Balance = 10m;

        u.CreditBalance(25m);

        Assert.Equal(35m, u.Balance);
    }

    [Fact]
    public void CreditBalance_Zero_Throws()
    {
        var u = UserEntity.Create("a", "A", "a@b.com", "hash", "seed");

        Assert.Throws<ArgumentOutOfRangeException>(() => u.CreditBalance(0m));
    }

    [Fact]
    public void CreditBalance_Negative_Throws()
    {
        var u = UserEntity.Create("a", "A", "a@b.com", "hash", "seed");

        Assert.Throws<ArgumentOutOfRangeException>(() => u.CreditBalance(-1m));
    }
}
