using Domain.Entities;
using Domain.Enums;
using Xunit;

namespace Domain.Specs.Domain.Entities;

public class TourInstanceEntityTests
{
    [Fact]
    public void AreAllTransportationApproved_ShouldIgnoreExternalTransport()
    {
        var instance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            InstanceDays = new List<TourInstanceDayEntity>
            {
                new()
                {
                    Activities = new List<TourInstanceDayActivityEntity>
                    {
                        new()
                        {
                            ActivityType = TourDayActivityType.Transportation,
                            TransportationType = TransportationType.Flight, // External -> Should be ignored
                            TransportSupplierId = Guid.NewGuid(),
                            TransportationApprovalStatus = ProviderApprovalStatus.Pending
                        },
                        new()
                        {
                            ActivityType = TourDayActivityType.Transportation,
                            TransportationType = TransportationType.Car, // Ground -> Must be approved
                            TransportSupplierId = Guid.NewGuid(),
                            TransportationApprovalStatus = ProviderApprovalStatus.Approved
                        }
                    }
                }
            }
        };

        var result = instance.AreAllTransportationApproved();

        Assert.True(result); // True because the only ground transport is approved
    }

    [Fact]
    public void AreAllTransportationApproved_ShouldReturnFalse_WhenGroundTransportIsPending()
    {
        var instance = new TourInstanceEntity
        {
            Id = Guid.NewGuid(),
            InstanceDays = new List<TourInstanceDayEntity>
            {
                new()
                {
                    Activities = new List<TourInstanceDayActivityEntity>
                    {
                        new()
                        {
                            ActivityType = TourDayActivityType.Transportation,
                            TransportationType = TransportationType.Car,
                            TransportSupplierId = Guid.NewGuid(),
                            TransportationApprovalStatus = ProviderApprovalStatus.Pending
                        }
                    }
                }
            }
        };

        var result = instance.AreAllTransportationApproved();

        Assert.False(result);
    }
}
