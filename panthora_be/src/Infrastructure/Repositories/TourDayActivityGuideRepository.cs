using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TourDayActivityGuideRepository(AppDbContext context)
    : Repository<TourDayActivityGuideEntity>(context), ITourDayActivityGuideRepository
{
    public async Task<IReadOnlyList<TourDayActivityGuideEntity>> GetByActivityStatusIdAsync(Guid tourDayActivityStatusId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => x.TourDayActivityStatusId == tourDayActivityStatusId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<TourDayActivityGuideEntity>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => x.UserId == userId)
            .ToListAsync(cancellationToken);
    }
}
