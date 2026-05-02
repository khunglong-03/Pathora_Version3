using Domain.Enums;
using Xunit;

namespace Domain.Specs.Domain.Enums;

public sealed class TransportationTypeExtensionsTests
{
    [Theory]
    [InlineData(TransportationType.Bus)]
    [InlineData(TransportationType.Car)]
    [InlineData(TransportationType.Motorbike)]
    [InlineData(TransportationType.Taxi)]
    [InlineData(TransportationType.Bicycle)]
    public void GetApprovalCategory_GroundVehicles_ReturnsGround(TransportationType type)
    {
        Assert.Equal(TransportApprovalCategory.Ground, type.GetApprovalCategory());
    }

    [Theory]
    [InlineData(TransportationType.Flight)]
    [InlineData(TransportationType.Train)]
    [InlineData(TransportationType.Boat)]
    [InlineData(TransportationType.Other)]
    public void GetApprovalCategory_ExternalTickets_ReturnsExternalTicket(TransportationType type)
    {
        Assert.Equal(TransportApprovalCategory.ExternalTicket, type.GetApprovalCategory());
    }

    [Fact]
    public void GetApprovalCategory_Walking_ReturnsNoApproval()
    {
        Assert.Equal(TransportApprovalCategory.NoApproval, TransportationType.Walking.GetApprovalCategory());
    }

    [Fact]
    public void GetApprovalCategory_UnmappedValue_ThrowsArgumentOutOfRangeException()
    {
        var bogus = (TransportationType)999;
        Assert.Throws<ArgumentOutOfRangeException>(() => bogus.GetApprovalCategory());
    }

    [Theory]
    [InlineData(TransportationType.Flight, true)]
    [InlineData(TransportationType.Train, true)]
    [InlineData(TransportationType.Boat, true)]
    [InlineData(TransportationType.Car, false)]
    [InlineData(TransportationType.Bus, false)]
    [InlineData(TransportationType.Motorbike, false)]
    [InlineData(TransportationType.Walking, false)]
    [InlineData(TransportationType.Other, false)]
    public void IsExternalOnly_ReturnsCorrectBoolean(TransportationType type, bool expected)
    {
        Assert.Equal(expected, type.IsExternalOnly());
    }

    [Fact]
    public void IsExternalOnly_Nullable_ReturnsCorrectBoolean()
    {
        TransportationType? nullType = null;
        TransportationType? flightType = TransportationType.Flight;
        TransportationType? carType = TransportationType.Car;

        Assert.False(nullType.IsExternalOnly());
        Assert.True(flightType.IsExternalOnly());
        Assert.False(carType.IsExternalOnly());
    }
}
