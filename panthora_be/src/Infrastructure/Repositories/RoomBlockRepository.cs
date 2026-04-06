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
    public async Task<RoomBlockEntity?> FindByIdAsync(Guid id)
    {
        return await _dbSet.FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<IReadOnlyList<RoomBlockEntity>> GetByDateRangeAsync(
        Guid supplierId, RoomType roomType, DateOnly fromDate, DateOnly toDate)
    {
        return await _dbSet
            .Where(x => x.SupplierId == supplierId
                && x.RoomType == roomType
                && x.BlockedDate >= fromDate
                && x.BlockedDate < toDate)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<RoomBlockEntity>> GetByBookingAccommodationDetailIdAsync(Guid bookingAccommodationDetailId)
    {
        return await _dbSet
            .Where(x => x.BookingAccommodationDetailId == bookingAccommodationDetailId)
            .ToListAsync();
    }

    public async Task<int> GetBlockedRoomCountAsync(Guid supplierId, RoomType roomType, DateOnly date)
    {
        return await _dbSet
            .Where(x => x.SupplierId == supplierId
                && x.RoomType == roomType
                && x.BlockedDate == date)
            .SumAsync(x => x.RoomCountBlocked);
    }

    public async Task DeleteByBookingAccommodationDetailIdAsync(Guid bookingAccommodationDetailId)
    {
        var blocks = await _dbSet
            .Where(x => x.BookingAccommodationDetailId == bookingAccommodationDetailId)
            .ToListAsync();

        _dbSet.RemoveRange(blocks);
    }
}
