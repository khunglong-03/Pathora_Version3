using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IBookingParticipantRepository : IRepository<BookingParticipantEntity>
{
    Task<IReadOnlyList<BookingParticipantEntity>> GetByBookingIdAsync(Guid bookingId);
}
