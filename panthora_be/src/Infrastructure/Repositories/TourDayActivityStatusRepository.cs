using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TourDayActivityStatusRepository(AppDbContext context)
    : Repository<TourDayActivityStatusEntity>(context), ITourDayActivityStatusRepository
{
    public async Task<IReadOnlyList<TourDayActivityStatusEntity>> GetByBookingIdAsync(Guid bookingId)
    {
        return await _dbSet
            .Where(x => x.BookingId == bookingId)
            .OrderBy(x => x.TourDayId)
            .ToListAsync();
    }

    public async Task<TourDayActivityStatusEntity?> GetByBookingIdAndTourDayIdAsync(Guid bookingId, Guid tourDayId)
    {
        return await _dbSet
            .FirstOrDefaultAsync(x => x.BookingId == bookingId && x.TourDayId == tourDayId);
    }
}
