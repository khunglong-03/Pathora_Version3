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
    Task<List<TourDayActivityRouteTransportEntity>> FindByOwnerIdAsync(
        Guid ownerId,
        int? statusFilter,
        CancellationToken cancellationToken = default);
    Task<TourDayActivityRouteTransportEntity?> FindByIdWithDetailsAsync(
        Guid id,
        CancellationToken cancellationToken = default);
    Task<List<TourDayActivityRouteTransportEntity>> FindCompletedByOwnerIdAsync(
        Guid ownerId,
        int year,
        int? quarter,
        CancellationToken cancellationToken = default);
    Task<List<TourDayActivityRouteTransportEntity>> FindCompletedByOwnerIdPaginatedAsync(
        Guid ownerId,
        int? year,
        int? quarter,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<int> CountCompletedByOwnerIdAsync(
        Guid ownerId,
        int? year,
        int? quarter,
        CancellationToken cancellationToken = default);
}
