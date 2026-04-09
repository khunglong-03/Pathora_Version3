using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ICancellationPolicyRepository
{
    Task<CancellationPolicyEntity?> FindById(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CancellationPolicyEntity>> FindAll(CancellationToken cancellationToken = default);
    Task<CancellationPolicyEntity?> FindByTourScopeAndDays(TourScope tourScope, int daysBeforeDeparture, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CancellationPolicyEntity>> FindByTourScope(TourScope tourScope, CancellationToken cancellationToken = default);
    Task Create(CancellationPolicyEntity entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(CancellationPolicyEntity entity, CancellationToken cancellationToken = default);
}
