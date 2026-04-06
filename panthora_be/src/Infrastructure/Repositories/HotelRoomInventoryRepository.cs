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
    public async Task<HotelRoomInventoryEntity?> FindByIdAsync(Guid id)
    {
        return await _dbSet.FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<HotelRoomInventoryEntity?> FindByHotelAndRoomTypeAsync(Guid supplierId, RoomType roomType)
    {
        return await _dbSet
            .Where(x => x.SupplierId == supplierId && x.RoomType == roomType)
            .FirstOrDefaultAsync();
    }

    public async Task<IReadOnlyList<HotelRoomInventoryEntity>> GetByHotelAsync(Guid supplierId)
    {
        return await _dbSet
            .Where(x => x.SupplierId == supplierId)
            .OrderBy(x => x.RoomType)
            .ToListAsync();
    }

    public void Remove(HotelRoomInventoryEntity entity) => _dbSet.Remove(entity);
}
