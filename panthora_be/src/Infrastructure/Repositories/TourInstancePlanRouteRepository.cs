using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TourInstancePlanRouteRepository(AppDbContext context)
    : Repository<TourInstancePlanRouteEntity>(context), ITourInstancePlanRouteRepository
{
    public async Task<TourInstancePlanRouteEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Set<TourInstancePlanRouteEntity>()
            .AsNoTracking()
            .Include(x => x.Vehicle)
            .Include(x => x.Driver)
            .Include(x => x.TourInstanceDayActivity)
                .ThenInclude(x => x.TourInstanceDay)
                    .ThenInclude(x => x.TourInstance)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<List<TourInstancePlanRouteEntity>> GetByTourInstanceIdAsync(Guid instanceId, CancellationToken cancellationToken = default)
    {
        return await _context.Set<TourInstancePlanRouteEntity>()
            .AsNoTracking()
            .Include(x => x.Vehicle)
            .Include(x => x.Driver)
            .Include(x => x.TourInstanceDayActivity)
                .ThenInclude(x => x.TourInstanceDay)
                    .ThenInclude(x => x.TourInstance)
            .Where(x => x.TourInstanceDayActivity.TourInstanceDay.TourInstanceId == instanceId)
            .OrderBy(x => x.TourInstanceDayActivity.TourInstanceDay.InstanceDayNumber)
            .ThenBy(x => x.TourInstanceDayActivity.Order)
            .ToListAsync(cancellationToken);
    }
}
