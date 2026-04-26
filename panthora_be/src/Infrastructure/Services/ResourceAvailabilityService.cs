using Application.Common.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class ResourceAvailabilityService(
    IRoomBlockRepository roomBlockRepository,
    IVehicleBlockRepository vehicleBlockRepository,
    IHotelRoomInventoryRepository inventoryRepository,
    AppDbContext context,
    ILogger<ResourceAvailabilityService> logger)
    : IResourceAvailabilityService
{
    public async Task<ErrorOr<bool>> CheckRoomAvailabilityAsync(
        Guid supplierId,
        RoomType roomType,
        DateOnly date,
        int requestedCount,
        Guid? excludeTourInstanceDayActivityId = null,
        CancellationToken cancellationToken = default,
        Guid? excludeTourInstanceId = null)
    {
        var inventory = await inventoryRepository.FindByHotelAndRoomTypeAsync(supplierId, roomType, cancellationToken);
        if (inventory == null)
        {
            return Error.Validation("Inventory.NotFound", $"Supplier {supplierId} does not have room type {roomType}");
        }

        var totalBlocked = await roomBlockRepository.GetBlockedRoomCountAsync(supplierId, roomType, date, null, cancellationToken);

        int selfBlocked = 0;
        if (excludeTourInstanceDayActivityId.HasValue)
        {
            var activityBlocks = await roomBlockRepository.GetByTourInstanceDayActivityIdAsync(excludeTourInstanceDayActivityId.Value, cancellationToken);
            selfBlocked = activityBlocks.Where(b => b.RoomType == roomType && b.BlockedDate == date).Sum(b => b.RoomCountBlocked);
        }

        // ER-10: subtract tour-level holds belonging to the caller's own TourInstance so a
        // customer booking doesn't get double-charged for rooms the tour has already held.
        int tourLevelSelfBlocked = 0;
        if (excludeTourInstanceId.HasValue)
        {
            var tourBlocks = await roomBlockRepository.GetBySupplierAsync(supplierId, cancellationToken);
            tourLevelSelfBlocked = tourBlocks
                .Where(b => b.RoomType == roomType
                            && b.BlockedDate == date
                            && b.TourInstanceDayActivity is not null
                            && b.TourInstanceDayActivity.TourInstanceDay.TourInstanceId == excludeTourInstanceId.Value)
                .Sum(b => b.RoomCountBlocked);
        }

        var netBlocked = totalBlocked - selfBlocked - tourLevelSelfBlocked;
        var available = inventory.TotalRooms - netBlocked;

        if (available < requestedCount)
        {
            logger.LogWarning("Room availability check failed for {SupplierId}, {RoomType} on {Date}. Available: {Available}, Requested: {Requested}",
                supplierId, roomType, date, available, requestedCount);
            return false;
        }

        return true;
    }

    public async Task<ErrorOr<bool>> CheckVehicleAvailabilityAsync(
        Guid vehicleId,
        DateOnly date,
        Guid? excludeTourInstanceDayActivityId = null,
        CancellationToken cancellationToken = default)
    {
        var activeBlocks = await vehicleBlockRepository.FindActiveBlocksAsync(vehicleId, date, cancellationToken);

        // Use shared predicate for active-hold logic (task 0.1/0.2)
        var nowUtc = DateTimeOffset.UtcNow;
        var otherActiveBlocks = activeBlocks
            .Where(b => Domain.Common.VehicleHoldPredicates.IsActiveHoldFunc(b, nowUtc))
            .Where(b => !excludeTourInstanceDayActivityId.HasValue
                     || b.TourInstanceDayActivityId != excludeTourInstanceDayActivityId.Value)
            .ToList();

        if (otherActiveBlocks.Count > 0)
        {
            logger.LogWarning("Vehicle availability check failed for {VehicleId} on {Date}. Vehicle has {Count} active hold(s).",
                vehicleId, date, otherActiveBlocks.Count);
            return false;
        }

        return true;
    }

    public async Task<ErrorOr<bool>> CheckDriverAvailabilityAsync(
        Guid driverId,
        DateOnly date,
        Guid? excludeTourInstanceDayActivityId = null,
        CancellationToken cancellationToken = default)
    {
        var isBusy = await context.TourInstanceTransportAssignments
            .AsNoTracking()
            .AnyAsync(a => a.DriverId == driverId
                        && a.TourInstanceDayActivity.TourInstanceDay.ActualDate == date
                        && (!excludeTourInstanceDayActivityId.HasValue || a.TourInstanceDayActivityId != excludeTourInstanceDayActivityId.Value)
                        && a.TourInstanceDayActivity.TransportationApprovalStatus != ProviderApprovalStatus.Rejected,
                cancellationToken);

        if (isBusy)
        {
            logger.LogWarning("Driver availability check failed for {DriverId} on {Date}. Driver is already assigned to another activity.",
                driverId, date);
            return false;
        }

        return true;
    }
}
