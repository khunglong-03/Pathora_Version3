using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IPaymentTransactionRepository
{
    Task<PaymentTransactionEntity?> GetByIdAsync(Guid id);
    Task<PaymentTransactionEntity?> GetByTransactionCodeAsync(string transactionCode);
    Task<PaymentTransactionEntity?> GetBySepayTransactionIdAsync(string sepayTransactionId);
    Task<PaymentTransactionEntity?> GetByBookingIdAsync(Guid bookingId);
    Task<List<PaymentTransactionEntity>> GetByBookingIdListAsync(Guid bookingId);
    Task<PaymentTransactionEntity?> GetPendingByBookingIdAsync(Guid bookingId);
    Task<PaymentTransactionEntity?> FindPendingByReferenceCodeAsync(string referenceCode);
    Task<List<PaymentTransactionEntity>> GetExpiredTransactionsAsync();
    Task<List<PaymentTransactionEntity>> GetPendingTransactionsAsync();
    Task<List<PaymentTransactionEntity>> GetAllAsync(int pageNumber = 1, int pageSize = 20);
    Task<int> GetTotalCountAsync();
    Task AddAsync(PaymentTransactionEntity transaction);
    Task UpdateAsync(PaymentTransactionEntity transaction);
    Task DeleteAsync(Guid id);
}
