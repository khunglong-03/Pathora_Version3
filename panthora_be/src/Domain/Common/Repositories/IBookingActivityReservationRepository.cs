using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IBookingActivityReservationRepository : IRepository<BookingActivityReservationEntity>
{
    Task<IReadOnlyList<BookingActivityReservationEntity>> GetByBookingIdAsync(Guid bookingId);
}
