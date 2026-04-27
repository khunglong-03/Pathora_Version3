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
}
