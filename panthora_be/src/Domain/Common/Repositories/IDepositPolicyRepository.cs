using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IDepositPolicyRepository : IRepository<DepositPolicyEntity>
{
    Task<IReadOnlyList<DepositPolicyEntity>> GetAllActiveAsync();
}
