using Domain.Entities;
using Domain.Enums;

namespace Domain.Common.Repositories;

public interface IBookingCancellationRequestRepository
{
    Task<BookingCancellationRequestEntity?> GetPendingByBookingId(Guid bookingId, CancellationToken cancellationToken = default);
    Task<List<BookingCancellationRequestEntity>> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default);
    Task<BookingCancellationRequestEntity?> GetById(Guid id, CancellationToken cancellationToken = default);
    Task Add(BookingCancellationRequestEntity entity, CancellationToken cancellationToken = default);

    Task<(List<BookingCancellationRequestEntity> Items, int TotalCount)> GetPagedByUserIdAsync(
        Guid userId,
        BookingCancellationRequestStatus? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<(List<BookingCancellationRequestEntity> Items, int TotalCount)> GetPagedForManagerAsync(
        BookingCancellationRequestStatus? status,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}

