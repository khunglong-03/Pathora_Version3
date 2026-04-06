using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IBookingRepository
{
    Task<BookingEntity?> GetByIdAsync(Guid id);
    Task<BookingEntity?> GetByIdWithDetailsAsync(Guid id);
    Task<List<BookingEntity>> GetByTourInstanceIdAsync(Guid tourInstanceId);
    Task<List<BookingEntity>> GetByUserIdAsync(Guid userId);
    Task<List<BookingEntity>> GetRecentByUserIdAsync(Guid userId, int count);
    Task<(List<BookingEntity> Items, int TotalCount)> GetAllPagedAsync(int page, int pageSize);
    Task<int> CountByTourInstanceIdAsync(Guid tourInstanceId);
    Task AddAsync(BookingEntity booking);
    Task UpdateAsync(BookingEntity booking);
    Task<BookingEntity?> GetByPaymentTransactionCodeAsync(string transactionCode);
}
