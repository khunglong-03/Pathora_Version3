using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IManagerBankAccountRepository
{
    Task<List<ManagerBankAccountEntity>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<ManagerBankAccountEntity?> GetByIdAndUserIdAsync(Guid id, Guid userId, CancellationToken ct = default);
    Task<ManagerBankAccountEntity?> GetDefaultByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<bool> AnyByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<int> CountByUserIdAsync(Guid userId, Guid? excludeId = null, CancellationToken ct = default);
    Task<ManagerBankAccountEntity?> GetLatestByUserIdAsync(Guid userId, Guid? excludeId = null, CancellationToken ct = default);
    Task AddAsync(ManagerBankAccountEntity entity, CancellationToken ct = default);
    void Remove(ManagerBankAccountEntity entity);
}
