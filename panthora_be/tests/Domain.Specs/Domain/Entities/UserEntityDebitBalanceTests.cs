using Domain.Entities;

namespace Domain.Specs.Domain.Entities;

public sealed class UserEntityDebitBalanceTests
{
    [Fact]
    public void DebitBalance_SubtractsFromBalance()
    {
        var u = UserEntity.Create("a", "A", "a@b.com", "hash", "seed");
        u.Balance = 100m;

        u.DebitBalance(25m);

        Assert.Equal(75m, u.Balance);
    }

    [Fact]
    public void DebitBalance_Zero_Throws()
    {
        var u = UserEntity.Create("a", "A", "a@b.com", "hash", "seed");

        Assert.Throws<ArgumentOutOfRangeException>(() => u.DebitBalance(0m));
    }

    [Fact]
    public void DebitBalance_Negative_Throws()
    {
        var u = UserEntity.Create("a", "A", "a@b.com", "hash", "seed");

        Assert.Throws<ArgumentOutOfRangeException>(() => u.DebitBalance(-1m));
    }
    
    [Fact]
    public void DebitBalance_Insufficient_Throws()
    {
        var u = UserEntity.Create("a", "A", "a@b.com", "hash", "seed");
        u.Balance = 50m;

        Assert.Throws<InvalidOperationException>(() => u.DebitBalance(100m));
    }
}
