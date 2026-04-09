using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IPaymentTransactionRepository
{
    Task<PaymentTransactionEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PaymentTransactionEntity?> GetByTransactionCodeAsync(string transactionCode, CancellationToken cancellationToken = default);
    Task<PaymentTransactionEntity?> GetBySepayTransactionIdAsync(string sepayTransactionId, CancellationToken cancellationToken = default);
    Task<PaymentTransactionEntity?> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default);
    Task<List<PaymentTransactionEntity>> GetByBookingIdListAsync(Guid bookingId, CancellationToken cancellationToken = default);
    Task<PaymentTransactionEntity?> GetPendingByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default);
    Task<PaymentTransactionEntity?> FindPendingByReferenceCodeAsync(string referenceCode, CancellationToken cancellationToken = default);
    Task<List<PaymentTransactionEntity>> GetExpiredTransactionsAsync(CancellationToken cancellationToken = default);
    Task<List<PaymentTransactionEntity>> GetPendingTransactionsAsync(CancellationToken cancellationToken = default);
    Task<List<PaymentTransactionEntity>> GetAllAsync(int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default);
    Task<int> GetTotalCountAsync(CancellationToken cancellationToken = default);
    Task AddAsync(PaymentTransactionEntity transaction, CancellationToken cancellationToken = default);
    Task UpdateAsync(PaymentTransactionEntity transaction, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
