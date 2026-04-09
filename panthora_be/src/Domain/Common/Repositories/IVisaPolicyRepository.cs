using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IVisaPolicyRepository : IRepository<VisaPolicyEntity>
{
    Task<IReadOnlyList<VisaPolicyEntity>> GetActivePoliciesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<VisaPolicyEntity>> GetAllPoliciesAsync(CancellationToken cancellationToken = default);
    Task<VisaPolicyEntity?> GetByRegionAsync(string region, CancellationToken cancellationToken = default);
}
