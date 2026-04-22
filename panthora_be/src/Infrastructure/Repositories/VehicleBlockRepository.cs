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
}
