using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IPricingPolicyRepository
{
    Task<PricingPolicy?> FindById(Guid id, bool asNoTracking = false, CancellationToken cancellationToken = default);
    Task<PricingPolicy?> FindByPolicyCode(string policyCode, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<List<PricingPolicy>> FindAll(bool includeDeleted = false, CancellationToken cancellationToken = default);
    Task<PricingPolicy?> GetDefaultPolicy(CancellationToken cancellationToken = default);
    Task<PricingPolicy?> GetActivePolicyByTourType(Domain.Enums.TourType tourType, CancellationToken cancellationToken = default);
    Task Create(PricingPolicy policy, CancellationToken cancellationToken = default);
    Task UpdateAsync(PricingPolicy policy, CancellationToken cancellationToken = default);
    Task SoftDelete(Guid id, CancellationToken cancellationToken = default);
    Task SetAsDefault(Guid id, CancellationToken cancellationToken = default);
    Task RemoveDefaultFromOthers(Guid excludeId, CancellationToken cancellationToken = default);
}
