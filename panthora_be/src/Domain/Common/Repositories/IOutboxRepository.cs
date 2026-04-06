using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IOutboxRepository
{
    Task<OutboxMessage> AddAsync(OutboxMessage message, CancellationToken cancellationToken = default);
    Task UpdateAsync(OutboxMessage message, CancellationToken cancellationToken = default);
    Task<List<OutboxMessage>> GetPendingMessagesAsync(int batchSize, CancellationToken cancellationToken = default);
    Task<OutboxMessage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
