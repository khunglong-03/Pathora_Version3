using Domain.Enums;
using ErrorOr;

namespace Application.Common.Interfaces;

public interface IResourceAvailabilityService
{
    Task<ErrorOr<bool>> CheckRoomAvailabilityAsync(
        Guid supplierId,
        RoomType roomType,
        DateOnly date,
        int requestedCount,
        Guid? excludeTourInstanceDayActivityId = null,
        CancellationToken cancellationToken = default);

    Task<ErrorOr<bool>> CheckVehicleAvailabilityAsync(
        Guid vehicleId,
        DateOnly date,
        Guid? excludeTourInstanceDayActivityId = null,
        CancellationToken cancellationToken = default);
}
