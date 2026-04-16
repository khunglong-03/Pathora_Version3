namespace Domain.Entities;

/// <summary>
/// Chi tiết gán phương tiện xe cộ thực tế cho một tuyến/hoạt động di chuyển của đợt tour.
/// </summary>
public class TourInstancePlanRouteEntity : Entity<Guid>
{
    public Guid TourInstanceDayActivityId { get; set; }
    public virtual TourInstanceDayActivityEntity TourInstanceDayActivity { get; set; } = null!;

    // Specific vehicle assigned
    public Guid? VehicleId { get; set; }
    public virtual VehicleEntity? Vehicle { get; set; }
    /// <summary>ID of Driver assigned to this route.</summary>
    public Guid? DriverId { get; set; }
    /// <summary>Driver assigned to this route.</summary>
    public virtual DriverEntity? Driver { get; set; }

    public string? PickupLocation { get; set; }
    public string? DropoffLocation { get; set; }

    public DateTimeOffset? DepartureTime { get; set; }
    public DateTimeOffset? ArrivalTime { get; set; }

    public static TourInstancePlanRouteEntity Create(
        Guid tourInstanceDayActivityId,
        Guid? vehicleId = null,
        Guid? driverId = null,
        string? pickupLocation = null,
        string? dropoffLocation = null,
        DateTimeOffset? departureTime = null,
        DateTimeOffset? arrivalTime = null)
    {
        return new TourInstancePlanRouteEntity
        {
            Id = Guid.CreateVersion7(),
            TourInstanceDayActivityId = tourInstanceDayActivityId,
            VehicleId = vehicleId,
            DriverId = driverId,
            PickupLocation = pickupLocation,
            DropoffLocation = dropoffLocation,
            DepartureTime = departureTime,
            ArrivalTime = arrivalTime
        };
    }

    public void AssignTransport(Guid vehicleId, Guid driverId)
    {
        VehicleId = vehicleId;
        DriverId = driverId;
    }

    public void Update(Guid? vehicleId = null, Guid? driverId = null, string? pickupLocation = null, string? dropoffLocation = null, DateTimeOffset? departureTime = null, DateTimeOffset? arrivalTime = null)
    {
        VehicleId = vehicleId;
        DriverId = driverId;
        PickupLocation = pickupLocation;
        DropoffLocation = dropoffLocation;
        DepartureTime = departureTime;
        ArrivalTime = arrivalTime;
    }
}
