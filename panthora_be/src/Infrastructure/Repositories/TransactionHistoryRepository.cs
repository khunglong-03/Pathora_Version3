using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;

namespace Infrastructure.Repositories;

public sealed class TransactionHistoryRepository(AppDbContext context) : ITransactionHistoryRepository
{
    private readonly AppDbContext _context = context;

    public async Task AddAsync(TransactionHistoryEntity entity, CancellationToken cancellationToken = default)
    {
        await _context.TransactionHistories.AddAsync(entity, cancellationToken);
    }
}
