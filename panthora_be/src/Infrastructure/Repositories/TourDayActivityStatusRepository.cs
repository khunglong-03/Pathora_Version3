using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TourDayActivityStatusRepository(AppDbContext context)
    : Repository<TourDayActivityStatusEntity>(context), ITourDayActivityStatusRepository
{
    public async Task<IReadOnlyList<TourDayActivityStatusEntity>> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => x.BookingId == bookingId)
            .OrderBy(x => x.TourDayId)
            .ToListAsync(cancellationToken);
    }

    public async Task<TourDayActivityStatusEntity?> GetByBookingIdAndTourDayIdAsync(Guid bookingId, Guid tourDayId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(x => x.BookingId == bookingId && x.TourDayId == tourDayId, cancellationToken);
    }
}
