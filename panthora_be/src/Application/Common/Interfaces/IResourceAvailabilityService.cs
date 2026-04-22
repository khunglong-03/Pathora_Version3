using Domain.Enums;
using ErrorOr;

namespace Application.Common.Interfaces;

public interface IResourceAvailabilityService
{
    /// <summary>
    /// Returns true if <paramref name="supplierId"/> has at least
    /// <paramref name="requestedCount"/> rooms of <paramref name="roomType"/> free on
    /// <paramref name="date"/>.
    /// </summary>
    /// <param name="excludeTourInstanceDayActivityId">
    /// When set, blocks owned by this specific activity are excluded — used by the
    /// "re-allocate same activity" flow so you're not blocked by your own hold.
    /// </param>
    /// <param name="excludeTourInstanceId">
    /// ER-10: when set, tour-level holds owned by this tour instance are excluded.
    /// Customer-booking availability calls pass <c>booking.TourInstanceId</c> so a
    /// tour's own pre-allocated rooms don't double-count against bookings that tour
    /// is already covering. Tour-level approve flows should leave this null.
    /// </param>
    Task<ErrorOr<bool>> CheckRoomAvailabilityAsync(
        Guid supplierId,
        RoomType roomType,
        DateOnly date,
        int requestedCount,
        Guid? excludeTourInstanceDayActivityId = null,
        CancellationToken cancellationToken = default,
        Guid? excludeTourInstanceId = null);

    Task<ErrorOr<bool>> CheckVehicleAvailabilityAsync(
        Guid vehicleId,
        DateOnly date,
        Guid? excludeTourInstanceDayActivityId = null,
        CancellationToken cancellationToken = default);
}
