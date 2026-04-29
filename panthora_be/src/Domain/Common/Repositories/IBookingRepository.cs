using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IBookingRepository
{
    Task<BookingEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BookingEntity?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<BookingEntity>> GetByTourInstanceIdAsync(Guid tourInstanceId, CancellationToken cancellationToken = default);
    Task<List<BookingEntity>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<List<BookingEntity>> GetRecentByUserIdAsync(Guid userId, int count, CancellationToken cancellationToken = default);
    Task<(List<BookingEntity> Items, int TotalCount)> GetAllPagedAsync(int page, int pageSize, CancellationToken cancellationToken = default);
    Task<int> CountByTourInstanceIdAsync(Guid tourInstanceId, CancellationToken cancellationToken = default);
    Task AddAsync(BookingEntity booking, CancellationToken cancellationToken = default);
    Task UpdateAsync(BookingEntity booking, CancellationToken cancellationToken = default);
    Task<BookingEntity?> GetByPaymentTransactionCodeAsync(string transactionCode, CancellationToken cancellationToken = default);
    Task<(List<BookingEntity> Items, int TotalCount)> GetPagedBookingsForUserAsync(string userIdStr, Domain.Enums.BookingStatus? status, int page, int pageSize, CancellationToken cancellationToken = default);
}
