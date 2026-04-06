using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IBookingTourGuideRepository : IRepository<BookingTourGuideEntity>
{
    Task<IReadOnlyList<BookingTourGuideEntity>> GetByBookingIdAsync(Guid bookingId);
    Task<BookingTourGuideEntity?> GetByBookingIdAndUserIdAsync(Guid bookingId, Guid userId);
}
