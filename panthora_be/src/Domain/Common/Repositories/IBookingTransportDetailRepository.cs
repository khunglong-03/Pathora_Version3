using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IBookingTransportDetailRepository : IRepository<BookingTransportDetailEntity>
{
    Task<IReadOnlyList<BookingTransportDetailEntity>> GetByBookingActivityReservationIdAsync(Guid bookingActivityReservationId);
}
