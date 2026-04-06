using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ITourDayActivityRouteTransportRepository : IRepository<TourDayActivityRouteTransportEntity>
{
    Task<TourDayActivityRouteTransportEntity?> FindByBookingAndRouteAsync(
        Guid bookingActivityReservationId,
        Guid tourPlanRouteId,
        CancellationToken cancellationToken = default);
    Task<TourDayActivityRouteTransportEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<TourDayActivityRouteTransportEntity>> FindByBookingIdAsync(
        Guid bookingId,
        CancellationToken cancellationToken = default);
    Task UpsertAsync(
        TourDayActivityRouteTransportEntity entity,
        CancellationToken cancellationToken = default);
    Task<TourDayActivityRouteTransportEntity?> FindByIdWithTourAsync(
        Guid id,
        CancellationToken cancellationToken = default);
    Task<Domain.Enums.Continent?> GetTourContinentByRouteIdAsync(
        Guid tourPlanRouteId,
        CancellationToken cancellationToken = default);
}
