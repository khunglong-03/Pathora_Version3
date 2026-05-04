using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IBookingCancellationRequestRepository
{
    Task<BookingCancellationRequestEntity?> GetPendingByBookingId(Guid bookingId, CancellationToken cancellationToken = default);
    Task<BookingCancellationRequestEntity?> GetById(Guid id, CancellationToken cancellationToken = default);
    Task Add(BookingCancellationRequestEntity entity, CancellationToken cancellationToken = default);
}
