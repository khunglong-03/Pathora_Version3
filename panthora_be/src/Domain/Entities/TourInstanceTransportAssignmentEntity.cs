namespace Domain.Entities;

/// <summary>
/// One concrete vehicle (and optional driver) assigned to a transportation activity.
/// An activity may have many rows; legacy <see cref="TourInstanceDayActivityEntity.VehicleId"/> remains until phase-out.
/// </summary>
public class TourInstanceTransportAssignmentEntity : Aggregate<Guid>
{
    public Guid TourInstanceDayActivityId { get; set; }
    public virtual TourInstanceDayActivityEntity TourInstanceDayActivity { get; set; } = null!;

    public Guid VehicleId { get; set; }
    public virtual VehicleEntity Vehicle { get; set; } = null!;

    /// <summary>Optional at approve time if business allows; validators enforce when required.</summary>
    public Guid? DriverId { get; set; }
    public virtual DriverEntity? Driver { get; set; }

    /// <summary>Seat capacity copied from vehicle at approve/migrate time; null if unknown in SQL-only backfill.</summary>
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
