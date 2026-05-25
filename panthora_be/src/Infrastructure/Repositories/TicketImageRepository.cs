using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TicketImageRepository(AppDbContext context)
    : Repository<TicketImageEntity>(context), ITicketImageRepository
{
    public async Task<TicketImageEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<List<TicketImageEntity>> FindByActivityAsync(Guid tourInstanceDayActivityId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(x => x.TourInstanceDayActivityId == tourInstanceDayActivityId)
            .OrderBy(x => x.UploadedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<TicketImageEntity>> GetByBookingIdAsync(Guid bookingId, Guid tourInstanceId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(x => x.TourInstanceDayActivity)
            .ThenInclude(x => x.TourInstanceDay)
            .Where(x => x.BookingId == bookingId ||
                       (x.BookingId == null && x.TourInstanceDayActivity.TourInstanceDay.TourInstanceId == tourInstanceId))
            .ToListAsync(cancellationToken);
    }
}
