using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IBookingTourGuideRepository : IRepository<BookingTourGuideEntity>
{
    Task<IReadOnlyList<BookingTourGuideEntity>> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default);
    Task<BookingTourGuideEntity?> GetByBookingIdAndUserIdAsync(Guid bookingId, Guid userId, CancellationToken cancellationToken = default);
}
