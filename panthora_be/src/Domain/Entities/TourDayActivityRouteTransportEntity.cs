namespace Domain.Entities;

public class TourDayActivityRouteTransportEntity : Aggregate<Guid>
{
    public Guid BookingActivityReservationId { get; set; }
    public virtual BookingActivityReservationEntity BookingActivityReservation { get; set; } = null!;
    public Guid TourPlanRouteId { get; set; }
    public virtual TourPlanRouteEntity TourPlanRoute { get; set; } = null!;
    public Guid? DriverId { get; set; }
    public virtual DriverEntity? Driver { get; set; }
    public Guid? VehicleId { get; set; }
    public virtual VehicleEntity? Vehicle { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public Guid UpdatedById { get; set; }

    public static TourDayActivityRouteTransportEntity Create(
        Guid bookingActivityReservationId,
        Guid tourPlanRouteId,
        Guid? driverId,
        Guid? vehicleId,
        Guid updatedById,
        string performedBy)
    {
        return new TourDayActivityRouteTransportEntity
        {
            Id = Guid.CreateVersion7(),
            BookingActivityReservationId = bookingActivityReservationId,
            TourPlanRouteId = tourPlanRouteId,
            DriverId = driverId,
            VehicleId = vehicleId,
            UpdatedAt = DateTimeOffset.UtcNow,
            UpdatedById = updatedById,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void Assign(Guid? driverId, Guid? vehicleId, Guid updatedById, string performedBy)
    {
        DriverId = driverId;
        VehicleId = vehicleId;
        UpdatedAt = DateTimeOffset.UtcNow;
        UpdatedById = updatedById;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
