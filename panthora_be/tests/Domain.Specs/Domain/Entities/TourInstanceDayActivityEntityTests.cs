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

    [Fact]
    public void UpdateTransportPlan_WhenExternalFlight_ShouldSyncStartTimeAndEndTimeFromDepartureAndArrival()
    {
        // Arrange
        var activity = TourInstanceDayActivityEntity.Create(
            Guid.NewGuid(),
            1,
            TourDayActivityType.Transportation,
            "Flight Hanoi to HCMC",
            "tester");

        var departure = new DateTimeOffset(2026, 5, 28, 8, 30, 0, TimeSpan.Zero);
        var arrival = new DateTimeOffset(2026, 5, 28, 10, 45, 0, TimeSpan.Zero);

        // Act
        activity.UpdateTransportPlan(
            TransportationType.Flight,
            "Vietnam Airlines VN245",
            Guid.NewGuid(),
            Guid.NewGuid(),
            departure,
            arrival,
            null,
            null,
            "VN245",
            "tester");

        // Assert
        Assert.NotNull(activity.StartTime);
        Assert.NotNull(activity.EndTime);
        Assert.Equal(new TimeOnly(8, 30), activity.StartTime);
        Assert.Equal(new TimeOnly(10, 45), activity.EndTime);
    }

    [Fact]
    public void UpdateTransportPlan_WhenGroundTransport_ShouldNotSyncStartTimeAndEndTimeAndClearExternalFields()
    {
        // Arrange
        var activity = TourInstanceDayActivityEntity.Create(
            Guid.NewGuid(),
            1,
            TourDayActivityType.Transportation,
            "Bus transfer",
            "tester",
            startTime: new TimeOnly(14, 0),
            endTime: new TimeOnly(15, 30));

        // Act
        activity.UpdateTransportPlan(
            TransportationType.Bus,
            "Bus 29 seats",
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            null,
            VehicleType.Coach,
            29,
            null,
            "tester");

        // Assert
        Assert.Equal(new TimeOnly(14, 0), activity.StartTime);
        Assert.Equal(new TimeOnly(15, 30), activity.EndTime);
        Assert.Null(activity.DepartureTime);
        Assert.Null(activity.ArrivalTime);
    }
}
