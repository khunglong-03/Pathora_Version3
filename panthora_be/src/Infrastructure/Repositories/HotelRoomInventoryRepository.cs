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

    public async Task<IReadOnlyList<HotelRoomInventoryEntity>> GetByHotelIdsAsync(List<Guid> supplierIds, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(x => x.Supplier)
            .Where(x => supplierIds.Contains(x.SupplierId))
            .OrderBy(x => x.Supplier.Name)
            .ThenBy(x => x.RoomType)
            .ToListAsync(cancellationToken);
    }

    public override async Task AddAsync(HotelRoomInventoryEntity entity, CancellationToken cancellationToken = default)
    {
        await base.AddAsync(entity, cancellationToken);
    }

    public void Remove(HotelRoomInventoryEntity entity) => _dbSet.Remove(entity);

    public async Task<Dictionary<(Guid SupplierId, RoomType RoomType), HotelRoomInventoryEntity>> FindByHotelAndRoomTypesAsync(
        IEnumerable<(Guid SupplierId, RoomType RoomType)> keys, CancellationToken cancellationToken = default)
    {
        var keyList = keys.ToList();
        if (keyList.Count == 0)
            return [];

        var supplierIds = keyList.Select(k => k.SupplierId).Distinct().ToList();
        var inventories = await _dbSet
            .AsNoTracking()
            .Where(x => supplierIds.Contains(x.SupplierId))
            .ToListAsync(cancellationToken);

        var result = new Dictionary<(Guid, RoomType), HotelRoomInventoryEntity>();
        foreach (var inv in inventories)
        {
            if (keyList.Any(k => k.SupplierId == inv.SupplierId && k.RoomType == inv.RoomType))
            {
                result[(inv.SupplierId, inv.RoomType)] = inv;
            }
        }

        return result;
    }
}
