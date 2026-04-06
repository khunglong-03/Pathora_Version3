using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IPricingPolicyRepository
{
    Task<PricingPolicy?> FindById(Guid id, bool asNoTracking = false);
    Task<PricingPolicy?> FindByPolicyCode(string policyCode, Guid? excludeId = null);
    Task<List<PricingPolicy>> FindAll(bool includeDeleted = false);
    Task<PricingPolicy?> GetDefaultPolicy();
    Task<PricingPolicy?> GetActivePolicyByTourType(Domain.Enums.TourType tourType);
    Task Create(PricingPolicy policy);
    Task UpdateAsync(PricingPolicy policy);
    Task SoftDelete(Guid id);
    Task SetAsDefault(Guid id);
    Task RemoveDefaultFromOthers(Guid excludeId);
}
