using global::Domain;
using Xunit;

namespace Domain.Specs.Entities;

public sealed class TourInstanceTransportAssignmentRulesTests
{
    [Fact]
    public void HasDuplicateVehicleIds_TrueWhenRepeated()
    {
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();
        Assert.True(TourInstanceTransportAssignmentRules.HasDuplicateVehicleIds([a, b, a]));
    }

    [Fact]
    public void HasDuplicateVehicleIds_FalseWhenUnique()
    {
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();
        Assert.False(TourInstanceTransportAssignmentRules.HasDuplicateVehicleIds([a, b]));
    }

    [Fact]
    public void HasDuplicateDriverIds_TrueWhenRepeated()
    {
        var d1 = Guid.NewGuid();
        var d2 = Guid.NewGuid();
        Assert.True(TourInstanceTransportAssignmentRules.HasDuplicateDriverIds([d1, d2, d1]));
    }

    [Fact]
    public void HasDuplicateDriverIds_FalseWhenUnique()
    {
        var d1 = Guid.NewGuid();
        var d2 = Guid.NewGuid();
        Assert.False(TourInstanceTransportAssignmentRules.HasDuplicateDriverIds([d1, d2]));
    }

    [Fact]
    public void HasDuplicateDriverIds_IgnoresEmptyGuid()
    {
        var d1 = Guid.NewGuid();
        Assert.False(TourInstanceTransportAssignmentRules.HasDuplicateDriverIds([Guid.Empty, d1, Guid.Empty]));
    }

    [Fact]
    public void SeatCapacityCoversRequest_WhenRequestedNull_AlwaysTrue()
    {
        Assert.True(TourInstanceTransportAssignmentRules.SeatCapacityCoversRequest(0, null));
        Assert.True(TourInstanceTransportAssignmentRules.SeatCapacityCoversRequest(5, null));
    }

    [Fact]
    public void SeatCapacityCoversRequest_ComparesToRequested()
    {
        Assert.True(TourInstanceTransportAssignmentRules.SeatCapacityCoversRequest(10, 10));
        Assert.False(TourInstanceTransportAssignmentRules.SeatCapacityCoversRequest(9, 10));
    }

    [Fact]
    public void SumEffectiveSeats_UsesSnapshotWhenPresent()
    {
        var sum = TourInstanceTransportAssignmentRules.SumEffectiveSeats([(8, 50), (null, 12)]);
        Assert.Equal(20, sum);
    }

    [Fact]
    public void SeatCapacityCoversRequest_HappyPathTwoVehiclesSumCovers()
    {
        var sum = TourInstanceTransportAssignmentRules.SumEffectiveSeats([(null, 16), (null, 16)]);
        Assert.True(TourInstanceTransportAssignmentRules.SeatCapacityCoversRequest(sum, 30));
    }

    [Fact]
    public void SeatCapacityCoversRequest_TwoVehicleFleet_FallsShort()
    {
        var sum = TourInstanceTransportAssignmentRules.SumEffectiveSeats([(null, 10), (null, 10)]);
        Assert.False(TourInstanceTransportAssignmentRules.SeatCapacityCoversRequest(sum, 30));
    }
}
