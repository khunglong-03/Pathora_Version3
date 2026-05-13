using Domain.Entities;
using Domain.Enums;

namespace Domain.Common.Repositories;

public interface IWithdrawalRequestRepository
{
    Task<WithdrawalRequestEntity?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<WithdrawalRequestEntity?> GetByIdWithUserAsync(Guid id, CancellationToken ct = default);
    Task<List<WithdrawalRequestEntity>> GetByUserIdAsync(Guid userId, WithdrawalStatus? status, int page, int pageSize, CancellationToken ct = default);
    Task<int> CountByUserIdAsync(Guid userId, WithdrawalStatus? status, CancellationToken ct = default);
    Task<List<WithdrawalRequestEntity>> GetAllAsync(WithdrawalStatus? status, string? search, int page, int pageSize, CancellationToken ct = default);
    Task<int> CountAllAsync(WithdrawalStatus? status, string? search, CancellationToken ct = default);
    Task<bool> HasPendingByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task AddAsync(WithdrawalRequestEntity entity, CancellationToken ct = default);
    void Update(WithdrawalRequestEntity entity);
}
