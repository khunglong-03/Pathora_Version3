using Domain.Entities;
using Domain.Enums;
using Xunit;

namespace Domain.Specs.Domain.Entities;

/// <summary>
/// Tests for TourInstancePlanRouteEntity — verifies vehicle/driver assignment
/// and route timing fields.
/// </summary>
public sealed class TourInstancePlanRouteEntityTests
{
    #region Creation

    [Fact]
    public void Create_WithVehicleAndDriver_SetsAllFields()
    {
        var activityId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var driverId = Guid.NewGuid();

        var route = TourInstancePlanRouteEntity.Create(
            tourInstanceDayActivityId: activityId,
            vehicleId: vehicleId,
            driverId: driverId,
            pickupLocation: "Hotel A",
            dropoffLocation: "Airport",
            departureTime: DateTimeOffset.UtcNow.AddHours(8),
            arrivalTime: DateTimeOffset.UtcNow.AddHours(10));

        Assert.NotEqual(Guid.Empty, route.Id);
        Assert.Equal(activityId, route.TourInstanceDayActivityId);
        Assert.Equal(vehicleId, route.VehicleId);
        Assert.Equal(driverId, route.DriverId);
        Assert.Equal("Hotel A", route.PickupLocation);
        Assert.Equal("Airport", route.DropoffLocation);
        Assert.NotNull(route.DepartureTime);
        Assert.NotNull(route.ArrivalTime);
    }

    [Fact]
    public void Create_WithNoVehicleOrDriver_SetsNulls()
    {
        var activityId = Guid.NewGuid();

        var route = TourInstancePlanRouteEntity.Create(
            tourInstanceDayActivityId: activityId);

        Assert.Equal(activityId, route.TourInstanceDayActivityId);
        Assert.Null(route.VehicleId);
        Assert.Null(route.DriverId);
        Assert.Null(route.PickupLocation);
        Assert.Null(route.DropoffLocation);
        Assert.Null(route.DepartureTime);
        Assert.Null(route.ArrivalTime);
    }

    [Fact]
    public void Create_WithVehicleOnly_SetsVehicleNotDriver()
    {
        var activityId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();

        var route = TourInstancePlanRouteEntity.Create(
            tourInstanceDayActivityId: activityId,
            vehicleId: vehicleId);

        Assert.Equal(vehicleId, route.VehicleId);
        Assert.Null(route.DriverId);
    }

    [Fact]
    public void Create_WithDriverOnly_SetsDriverNotVehicle()
    {
        var activityId = Guid.NewGuid();
        var driverId = Guid.NewGuid();

        var route = TourInstancePlanRouteEntity.Create(
            tourInstanceDayActivityId: activityId,
            driverId: driverId);

        Assert.Null(route.VehicleId);
        Assert.Equal(driverId, route.DriverId);
    }

    #endregion

    #region Update

    [Fact]
    public void Update_ChangesVehicleAndDriver()
    {
        var activityId = Guid.NewGuid();
        var originalVehicleId = Guid.NewGuid();
        var newVehicleId = Guid.NewGuid();
        var newDriverId = Guid.NewGuid();

        var route = TourInstancePlanRouteEntity.Create(
            tourInstanceDayActivityId: activityId,
            vehicleId: originalVehicleId);

        route.Update(
            vehicleId: newVehicleId,
            driverId: newDriverId,
            pickupLocation: "New Pickup",
            dropoffLocation: "New Dropoff",
            departureTime: DateTimeOffset.UtcNow.AddHours(9),
            arrivalTime: DateTimeOffset.UtcNow.AddHours(12));

        Assert.Equal(newVehicleId, route.VehicleId);
        Assert.Equal(newDriverId, route.DriverId);
        Assert.Equal("New Pickup", route.PickupLocation);
        Assert.Equal("New Dropoff", route.DropoffLocation);
        Assert.NotNull(route.DepartureTime);
        Assert.NotNull(route.ArrivalTime);
    }

    [Fact]
    public void Update_CanClearVehicle()
    {
        var activityId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();

        var route = TourInstancePlanRouteEntity.Create(
            tourInstanceDayActivityId: activityId,
            vehicleId: vehicleId);

        route.Update(vehicleId: null);

        Assert.Null(route.VehicleId);
    }

    [Fact]
    public void Update_CanClearDriver()
    {
        var activityId = Guid.NewGuid();
        var driverId = Guid.NewGuid();

        var route = TourInstancePlanRouteEntity.Create(
            tourInstanceDayActivityId: activityId,
            driverId: driverId);

        route.Update(driverId: null);

        Assert.Null(route.DriverId);
    }

    [Fact]
    public void Update_CanUpdateOnlyLocations()
    {
        var activityId = Guid.NewGuid();

        var route = TourInstancePlanRouteEntity.Create(
            tourInstanceDayActivityId: activityId,
            pickupLocation: "Old Pickup",
            dropoffLocation: "Old Dropoff");

        route.Update(pickupLocation: "Updated Pickup", dropoffLocation: "Updated Dropoff");

        Assert.Equal("Updated Pickup", route.PickupLocation);
        Assert.Equal("Updated Dropoff", route.DropoffLocation);
    }

    [Fact]
    public void Update_CanUpdateOnlyTiming()
    {
        var activityId = Guid.NewGuid();
        var departure = DateTimeOffset.UtcNow.AddHours(7);
        var arrival = DateTimeOffset.UtcNow.AddHours(9);

        var route = TourInstancePlanRouteEntity.Create(
            tourInstanceDayActivityId: activityId);

        route.Update(departureTime: departure, arrivalTime: arrival);

        Assert.Equal(departure, route.DepartureTime);
        Assert.Equal(arrival, route.ArrivalTime);
    }

    [Fact]
    public void Update_SetsVehicleIdAndDriverIdSeparately()
    {
        var activityId = Guid.NewGuid();
        var vehicleId = Guid.NewGuid();
        var driverId = Guid.NewGuid();

        var route = TourInstancePlanRouteEntity.Create(
            tourInstanceDayActivityId: activityId);

        // Assign vehicle first
        route.Update(vehicleId: vehicleId);
        Assert.Equal(vehicleId, route.VehicleId);
        Assert.Null(route.DriverId);

        // Then assign driver
        route.Update(driverId: driverId);
        Assert.Equal(vehicleId, route.VehicleId); // unchanged
        Assert.Equal(driverId, route.DriverId);
    }

    #endregion
}
