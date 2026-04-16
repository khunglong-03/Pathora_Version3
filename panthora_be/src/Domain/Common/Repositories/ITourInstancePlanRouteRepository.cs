using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ITourInstancePlanRouteRepository : IRepository<TourInstancePlanRouteEntity>
{
    Task<TourInstancePlanRouteEntity?> GetDetailsByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TourInstancePlanRouteEntity?> GetDetailsByIdTrackingAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<TourInstancePlanRouteEntity>> GetByTourInstanceIdAsync(Guid instanceId, CancellationToken cancellationToken = default);
}
