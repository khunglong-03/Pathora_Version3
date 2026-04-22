using Application.Common.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class ResourceAvailabilityService(
    IRoomBlockRepository roomBlockRepository,
    IVehicleBlockRepository vehicleBlockRepository,
    IHotelRoomInventoryRepository inventoryRepository,
    ILogger<ResourceAvailabilityService> logger)
    : IResourceAvailabilityService
{
    public async Task<ErrorOr<bool>> CheckRoomAvailabilityAsync(
        Guid supplierId,
        RoomType roomType,
        DateOnly date,
        int requestedCount,
        Guid? excludeTourInstanceDayActivityId = null,
        CancellationToken cancellationToken = default)
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

        var netBlocked = totalBlocked - selfBlocked;
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
        
        var otherBlocks = excludeTourInstanceDayActivityId.HasValue
            ? activeBlocks.Where(b => b.TourInstanceDayActivityId != excludeTourInstanceDayActivityId.Value)
            : activeBlocks;

        if (otherBlocks.Any(b => b.HoldStatus == HoldStatus.Hard))
        {
            logger.LogWarning("Vehicle availability check failed for {VehicleId} on {Date}. Vehicle has a hard hold.", vehicleId, date);
            return false;
        }

        // Note: For now, if there is ANY soft hold by others, we might want to warn or block.
        // The design says "Vehicle has a hard hold" -> fail. 
        // If there's a soft hold, we might still allow another soft hold or wait.
        // For hardening, let's treat any active hold (Soft or Hard) as "Occupied" to be safe.
        
        if (otherBlocks.Any())
        {
            logger.LogWarning("Vehicle availability check failed for {VehicleId} on {Date}. Vehicle has active holds.", vehicleId, date);
            return false;
        }

        return true;
    }
}
