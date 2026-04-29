namespace Domain.Entities;

public class TourInstanceTransportAssignmentEntity : Aggregate<Guid>
{
    public Guid TourInstanceDayActivityId { get; set; }
    public virtual TourInstanceDayActivityEntity TourInstanceDayActivity { get; set; } = null!;

    public Guid VehicleId { get; set; }
    public virtual VehicleEntity Vehicle { get; set; } = null!;

    public Guid? DriverId { get; set; }
    public virtual DriverEntity? Driver { get; set; }

    public int? SeatCountSnapshot { get; set; }

    public static TourInstanceTransportAssignmentEntity Create(
        Guid tourInstanceDayActivityId,
        Guid vehicleId,
        Guid? driverId,
        int? seatCountSnapshot,
        string performedBy)
    {
        return new TourInstanceTransportAssignmentEntity
        {
            Id = Guid.CreateVersion7(),
            TourInstanceDayActivityId = tourInstanceDayActivityId,
            VehicleId = vehicleId,
            DriverId = driverId,
            SeatCountSnapshot = seatCountSnapshot,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }
}
