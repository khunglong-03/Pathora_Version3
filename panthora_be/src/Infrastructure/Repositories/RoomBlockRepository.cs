namespace Infrastructure.Repositories;

using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

public class RoomBlockRepository(AppDbContext context)
    : Repository<RoomBlockEntity>(context), IRoomBlockRepository
{
    public async Task<RoomBlockEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<RoomBlockEntity>> GetByDateRangeAsync(
        Guid supplierId, RoomType roomType, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => x.SupplierId == supplierId
                && x.RoomType == roomType
                && x.BlockedDate >= fromDate
                && x.BlockedDate < toDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<RoomBlockEntity>> GetByBookingAccommodationDetailIdAsync(Guid bookingAccommodationDetailId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => x.BookingAccommodationDetailId == bookingAccommodationDetailId)
            .ToListAsync(cancellationToken);
    }

    public override async Task AddRangeAsync(IEnumerable<RoomBlockEntity> entities, CancellationToken cancellationToken = default)
    {
        await base.AddRangeAsync(entities, cancellationToken);
    }

    public async Task<int> GetBlockedRoomCountAsync(Guid supplierId, RoomType roomType, DateOnly date, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => x.SupplierId == supplierId
                && x.RoomType == roomType
                && x.BlockedDate == date)
            .SumAsync(x => x.RoomCountBlocked, cancellationToken);
    }

    public async Task DeleteByBookingAccommodationDetailIdAsync(Guid bookingAccommodationDetailId, CancellationToken cancellationToken = default)
    {
        var blocks = await _dbSet
            .Where(x => x.BookingAccommodationDetailId == bookingAccommodationDetailId)
            .ToListAsync(cancellationToken);

        _dbSet.RemoveRange(blocks);
    }

    public async Task<IReadOnlyList<RoomBlockEntity>> GetBySupplierAsync(Guid supplierId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => x.SupplierId == supplierId)
            .OrderBy(x => x.BlockedDate)
            .ToListAsync(cancellationToken);
    }

    public void Remove(RoomBlockEntity entity)
    {
        _dbSet.Remove(entity);
    }

    public void Add(RoomBlockEntity entity)
    {
        _dbSet.Add(entity);
    }
}
