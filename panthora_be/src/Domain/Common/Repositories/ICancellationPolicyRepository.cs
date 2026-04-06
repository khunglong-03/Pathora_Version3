using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ICancellationPolicyRepository
{
    Task<CancellationPolicyEntity?> FindById(Guid id);
    Task<IReadOnlyList<CancellationPolicyEntity>> FindAll();
    Task<CancellationPolicyEntity?> FindByTourScopeAndDays(TourScope tourScope, int daysBeforeDeparture);
    Task<IReadOnlyList<CancellationPolicyEntity>> FindByTourScope(TourScope tourScope);
    Task Create(CancellationPolicyEntity entity);
    Task UpdateAsync(CancellationPolicyEntity entity);
}
