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

    private static TourInstanceEntity CreateValidInstance(TourType tourType = TourType.Private)
    {
        return TourInstanceEntity.Create(
            Guid.NewGuid(), Guid.NewGuid(), "Title", "Name", "Code", "Class",
            tourType, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(5),
            10, 1000m, "TEST");
    }

    [Fact]
    public void ChangeStatus_FromConfirmedToPendingVisa_ShouldBeValid()
    {
        var instance = CreateValidInstance();
        instance.ChangeStatus(TourInstanceStatus.Confirmed, "TEST");

        var act = () => instance.ChangeStatus(TourInstanceStatus.PendingVisa, "TEST");

        var exception = Record.Exception(act);
        Assert.Null(exception);
        Assert.Equal(TourInstanceStatus.PendingVisa, instance.Status);
    }

    [Fact]
    public void ChangeStatus_FromPendingVisaToConfirmed_ShouldBeValid()
    {
        var instance = CreateValidInstance();
        instance.ChangeStatus(TourInstanceStatus.Confirmed, "TEST");
        instance.ChangeStatus(TourInstanceStatus.PendingVisa, "TEST");

        var act = () => instance.ChangeStatus(TourInstanceStatus.Confirmed, "TEST");

        var exception = Record.Exception(act);
        Assert.Null(exception);
        Assert.Equal(TourInstanceStatus.Confirmed, instance.Status);
    }

    [Fact]
    public void ChangeStatus_FromPendingVisaToInProgress_ShouldThrow()
    {
        var instance = CreateValidInstance();
        instance.ChangeStatus(TourInstanceStatus.Confirmed, "TEST");
        instance.ChangeStatus(TourInstanceStatus.PendingVisa, "TEST");

        var act = () => instance.ChangeStatus(TourInstanceStatus.InProgress, "TEST");

        var ex = Assert.Throws<InvalidOperationException>(act);
        Assert.Contains("Không thể chuyển trạng thái", ex.Message);
    }

    [Fact]
    public void EnterVisaGate_WhenPublicTour_ShouldThrow()
    {
        var instance = CreateValidInstance(TourType.Public);
        instance.ChangeStatus(TourInstanceStatus.Confirmed, "TEST");

        var act = () => instance.EnterVisaGate("TEST");

        var ex = Assert.Throws<InvalidOperationException>(act);
        Assert.Contains("Private tour", ex.Message);
    }
}
