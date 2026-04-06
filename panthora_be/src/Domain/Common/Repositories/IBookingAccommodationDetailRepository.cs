using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IBookingAccommodationDetailRepository : IRepository<BookingAccommodationDetailEntity>
{
    Task<IReadOnlyList<BookingAccommodationDetailEntity>> GetByBookingActivityReservationIdAsync(Guid bookingActivityReservationId);
}
