namespace Infrastructure.Repositories;

using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

public class VehicleBlockRepository(AppDbContext context)
    : Repository<VehicleBlockEntity>(context), IVehicleBlockRepository
{
    public async Task<VehicleBlockEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<VehicleBlockEntity>> FindActiveBlocksAsync(Guid vehicleId, DateOnly date, CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        return await _dbSet
            .Where(x => x.VehicleId == vehicleId
                && x.BlockedDate == date
                && (x.HoldStatus == HoldStatus.Hard || (x.HoldStatus == HoldStatus.Soft && x.ExpiresAt > now)))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<VehicleBlockEntity>> GetByActivityIdAsync(Guid tourInstanceDayActivityId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => x.TourInstanceDayActivityId == tourInstanceDayActivityId)
            .ToListAsync(cancellationToken);
    }

    public void Remove(VehicleBlockEntity entity)
    {
        _dbSet.Remove(entity);
    }

    public async Task DeleteByActivityAsync(Guid tourInstanceDayActivityId, CancellationToken cancellationToken = default)
    {
        var blocks = await _dbSet
            .Where(x => x.TourInstanceDayActivityId == tourInstanceDayActivityId)
            .ToListAsync(cancellationToken);

        _dbSet.RemoveRange(blocks);
    }

    public async Task DeleteByTourInstanceAsync(Guid tourInstanceId, CancellationToken cancellationToken = default)
    {
        var blocks = await _dbSet
            .Where(x => x.TourInstanceDayActivity != null && x.TourInstanceDayActivity.TourInstanceDay.TourInstanceId == tourInstanceId)
            .ToListAsync(cancellationToken);

        _dbSet.RemoveRange(blocks);
    }

    public async Task<List<VehicleScheduleProjection>> GetByOwnerAndDateRangeAsync(
        IReadOnlyCollection<Guid> ownedSupplierIds,
        Guid ownerUserId,
        DateOnly fromDate,
        DateOnly toDate,
        Guid? vehicleId,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet
            .AsNoTracking()
            .Where(b => b.BlockedDate >= fromDate && b.BlockedDate <= toDate)
            // Scope to owner's vehicles (same logic as availability query)
            .Where(b => b.Vehicle != null
                     && ((b.Vehicle.SupplierId != null && ownedSupplierIds.Contains(b.Vehicle.SupplierId ?? Guid.Empty))
                      || (b.Vehicle.SupplierId == null && b.Vehicle.OwnerId == ownerUserId)));

        if (vehicleId.HasValue)
            query = query.Where(b => b.VehicleId == vehicleId.Value);

        // Project to DTO — null-safe for orphaned Day→TourInstance navigations
        return await query
            .Select(b => new VehicleScheduleProjection(
                b.Id,
                b.VehicleId,
                b.Vehicle!.VehicleType,
                b.Vehicle.Brand,
                b.Vehicle.Model,
                b.Vehicle.SeatCapacity,
                b.BlockedDate,
                b.HoldStatus,
                b.TourInstanceDayActivity != null
                    ? b.TourInstanceDayActivity.TourInstanceDay.TourInstance.TourName
                    : null,
                b.TourInstanceDayActivity != null
                    ? b.TourInstanceDayActivity.TourInstanceDay.TourInstance.TourInstanceCode
                    : null,
                b.TourInstanceDayActivity != null
                    ? b.TourInstanceDayActivity.Title
                    : null,
                b.TourInstanceDayActivity != null && b.TourInstanceDayActivity.FromLocation != null
                    ? b.TourInstanceDayActivity.FromLocation.LocationName
                    : null,
                b.TourInstanceDayActivity != null && b.TourInstanceDayActivity.ToLocation != null
                    ? b.TourInstanceDayActivity.ToLocation.LocationName
                    : null))
            .OrderBy(s => s.BlockedDate)
            .ThenBy(s => s.VehicleBrand)
            .ToListAsync(cancellationToken);
    }
}
