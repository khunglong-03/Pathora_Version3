namespace Infrastructure.Repositories;

using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

public class HotelRoomInventoryRepository(AppDbContext context)
    : Repository<HotelRoomInventoryEntity>(context), IHotelRoomInventoryRepository
{
    public async Task<HotelRoomInventoryEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<HotelRoomInventoryEntity?> FindByHotelAndRoomTypeAsync(Guid supplierId, RoomType roomType, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => x.SupplierId == supplierId && x.RoomType == roomType)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<HotelRoomInventoryEntity>> GetByHotelAsync(Guid supplierId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => x.SupplierId == supplierId)
            .OrderBy(x => x.RoomType)
            .ToListAsync(cancellationToken);
    }

    public override async Task AddAsync(HotelRoomInventoryEntity entity, CancellationToken cancellationToken = default)
    {
        await base.AddAsync(entity, cancellationToken);
    }

    public void Remove(HotelRoomInventoryEntity entity) => _dbSet.Remove(entity);
}
