using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Domain.Common.Repositories;

public interface ITourGuideTaskRepository : IRepository<TourGuideTaskEntity>
{
    Task<List<TourGuideTaskEntity>> GetByTourInstanceIdAsync(Guid tourInstanceId, CancellationToken cancellationToken = default);
}
