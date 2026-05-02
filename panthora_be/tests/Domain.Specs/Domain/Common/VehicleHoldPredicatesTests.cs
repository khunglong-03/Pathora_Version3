namespace Domain.Specs.Domain.Common;

using global::Domain.Common;
using global::Domain.Entities;
using global::Domain.Enums;

/// <summary>
/// Contract tests for <see cref="VehicleHoldPredicates"/> — validates the
/// shared active-hold predicate used by both in-memory checks and EF queries.
/// Test cases: Hard / Soft unexpired / Soft expired / Soft with null ExpiresAt.
/// </summary>
public sealed class VehicleHoldPredicatesTests
{
    private static readonly DateTimeOffset NowUtc = new(2026, 5, 15, 12, 0, 0, TimeSpan.Zero);

    private static VehicleBlockEntity MakeBlock(HoldStatus status, DateTimeOffset? expiresAt) =>
        new()
        {
            Id = Guid.NewGuid(),
            VehicleId = Guid.NewGuid(),
            BlockedDate = DateOnly.FromDateTime(NowUtc.DateTime),
            HoldStatus = status,
            ExpiresAt = expiresAt,
        };

    // --- Expression-based predicate (for EF Core) ---

    [Fact]
    public void IsActiveHold_HardHold_ReturnsTrue()
    {
        var block = MakeBlock(HoldStatus.Hard, expiresAt: null);
        var predicate = VehicleHoldPredicates.IsActiveHold(NowUtc).Compile();

        Assert.True(predicate(block));
    }

    [Fact]
    public void IsActiveHold_SoftNotExpired_ReturnsTrue()
    {
        var block = MakeBlock(HoldStatus.Soft, expiresAt: NowUtc.AddHours(1));
        var predicate = VehicleHoldPredicates.IsActiveHold(NowUtc).Compile();

        Assert.True(predicate(block));
    }

    [Fact]
    public void IsActiveHold_SoftExpired_ReturnsFalse()
    {
        var block = MakeBlock(HoldStatus.Soft, expiresAt: NowUtc.AddHours(-1));
        var predicate = VehicleHoldPredicates.IsActiveHold(NowUtc).Compile();

        Assert.False(predicate(block));
    }

    [Fact]
    public void IsActiveHold_SoftNullExpiry_ReturnsFalse()
    {
        var block = MakeBlock(HoldStatus.Soft, expiresAt: null);
        var predicate = VehicleHoldPredicates.IsActiveHold(NowUtc).Compile();

        Assert.False(predicate(block));
    }

    // --- Func-based predicate (for in-memory / LINQ-to-Objects) ---

    [Fact]
    public void IsActiveHoldFunc_HardHold_ReturnsTrue()
    {
        var block = MakeBlock(HoldStatus.Hard, expiresAt: null);
        Assert.True(VehicleHoldPredicates.IsActiveHoldFunc(block, NowUtc));
    }

    [Fact]
    public void IsActiveHoldFunc_SoftNotExpired_ReturnsTrue()
    {
        var block = MakeBlock(HoldStatus.Soft, expiresAt: NowUtc.AddHours(1));
        Assert.True(VehicleHoldPredicates.IsActiveHoldFunc(block, NowUtc));
    }

    [Fact]
    public void IsActiveHoldFunc_SoftExpired_ReturnsFalse()
    {
        var block = MakeBlock(HoldStatus.Soft, expiresAt: NowUtc.AddHours(-1));
        Assert.False(VehicleHoldPredicates.IsActiveHoldFunc(block, NowUtc));
    }

    [Fact]
    public void IsActiveHoldFunc_SoftNullExpiry_ReturnsFalse()
    {
        var block = MakeBlock(HoldStatus.Soft, expiresAt: null);
        Assert.False(VehicleHoldPredicates.IsActiveHoldFunc(block, NowUtc));
    }

    // --- Edge cases: both predicates must agree ---

    [Fact]
    public void BothPredicates_AgreeOnExactBoundary()
    {
        // ExpiresAt == NowUtc means NOT active (> is strict)
        var block = MakeBlock(HoldStatus.Soft, expiresAt: NowUtc);
        var exprResult = VehicleHoldPredicates.IsActiveHold(NowUtc).Compile()(block);
        var funcResult = VehicleHoldPredicates.IsActiveHoldFunc(block, NowUtc);

        Assert.Equal(exprResult, funcResult);
        Assert.False(exprResult); // boundary: not > NowUtc
    }

    [Fact]
    public void BothPredicates_AgreeOnSoftOneMsBeforeExpiry()
    {
        var block = MakeBlock(HoldStatus.Soft, expiresAt: NowUtc.AddMilliseconds(1));
        var exprResult = VehicleHoldPredicates.IsActiveHold(NowUtc).Compile()(block);
        var funcResult = VehicleHoldPredicates.IsActiveHoldFunc(block, NowUtc);

        Assert.True(exprResult);
        Assert.True(funcResult);
    }
}
