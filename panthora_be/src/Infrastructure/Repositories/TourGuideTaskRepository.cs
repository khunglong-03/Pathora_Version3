using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Infrastructure.Repositories;

public class TourGuideTaskRepository(AppDbContext context) : Repository<TourGuideTaskEntity>(context), ITourGuideTaskRepository
{
    public async Task<List<TourGuideTaskEntity>> GetByTourInstanceIdAsync(Guid tourInstanceId, CancellationToken cancellationToken = default)
    {
        return await _context.TourGuideTasks
            .Where(x => x.TourInstanceId == tourInstanceId)
            .ToListAsync(cancellationToken);
    }
}
