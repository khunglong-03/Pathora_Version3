using System;
using global::Domain.Entities;
using global::Domain.Enums;
using Xunit;

namespace Domain.Specs.Entities;

public sealed class TourInstanceDayActivityEntityTests
{
    [Fact]
    public void ApproveTransportation_SetsApprovedStatusAndAssignments()
    {
        var activity = TourInstanceDayActivityEntity.Create(
            Guid.NewGuid(),
            1,
            TourDayActivityType.Transportation,
            "Airport transfer",
            "tester");

        var supplierId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var driverId = Guid.NewGuid();

        activity.AssignTransportSupplier(supplierId, VehicleType.Coach, 24);

        activity.ApproveTransportation(vehicleId, driverId, "approved");

        Assert.Equal(supplierId, activity.TransportSupplierId);
        Assert.Equal(vehicleId, activity.VehicleId);
        Assert.Equal(driverId, activity.DriverId);
        Assert.Equal(ProviderApprovalStatus.Approved, activity.TransportationApprovalStatus);
        Assert.Equal("approved", activity.TransportationApprovalNote);
    }

    [Fact]
    public void RejectTransportation_ClearsAssignmentsAndSetsRejected()
    {
        var activity = TourInstanceDayActivityEntity.Create(
            Guid.NewGuid(),
            1,
            TourDayActivityType.Transportation,
            "Airport transfer",
            "tester");

        activity.AssignTransportSupplier(Guid.NewGuid(), VehicleType.Coach, 24);
        activity.ApproveTransportation(Guid.NewGuid(), Guid.NewGuid(), "approved");

        activity.RejectTransportation("vehicle unavailable");

        Assert.Null(activity.VehicleId);
        Assert.Null(activity.DriverId);
        Assert.Equal(ProviderApprovalStatus.Rejected, activity.TransportationApprovalStatus);
        Assert.Equal("vehicle unavailable", activity.TransportationApprovalNote);
    }
}
