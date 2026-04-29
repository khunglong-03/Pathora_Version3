using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ITransactionHistoryRepository
{
    Task AddAsync(TransactionHistoryEntity entity, CancellationToken cancellationToken = default);
}
