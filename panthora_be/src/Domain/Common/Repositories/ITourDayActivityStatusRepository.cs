using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ITourDayActivityStatusRepository : IRepository<TourDayActivityStatusEntity>
{
    Task<IReadOnlyList<TourDayActivityStatusEntity>> GetByBookingIdAsync(Guid bookingId);
    Task<TourDayActivityStatusEntity?> GetByBookingIdAndTourDayIdAsync(Guid bookingId, Guid tourDayId);
}
