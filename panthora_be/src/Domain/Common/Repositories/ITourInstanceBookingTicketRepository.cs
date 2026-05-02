using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ITourInstanceBookingTicketRepository : IRepository<TourInstanceBookingTicketEntity>
{
    Task<List<TourInstanceBookingTicketEntity>> GetByActivityIdAsync(Guid activityId, CancellationToken cancellationToken = default);
    Task<TourInstanceBookingTicketEntity?> GetByActivityAndBookingAsync(Guid activityId, Guid bookingId, CancellationToken cancellationToken = default);
}
