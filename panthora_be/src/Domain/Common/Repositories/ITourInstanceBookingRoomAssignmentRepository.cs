using Domain.Entities;
using Domain.Enums;

namespace Domain.Common.Repositories;

public interface ITourInstanceBookingRoomAssignmentRepository : IRepository<TourInstanceBookingRoomAssignmentEntity>
{
    Task<List<TourInstanceBookingRoomAssignmentEntity>> GetByActivityIdAsync(Guid activityId, CancellationToken cancellationToken = default);
    Task<TourInstanceBookingRoomAssignmentEntity?> GetByActivityAndBookingAsync(Guid activityId, Guid bookingId, CancellationToken cancellationToken = default);

    Task<TourInstanceBookingRoomAssignmentEntity?> GetByActivityBookingAndRoomTypeAsync(
        Guid activityId,
        Guid bookingId,
        RoomType roomType,
        CancellationToken cancellationToken = default);

    Task<List<TourInstanceBookingRoomAssignmentEntity>> GetByActivityAndBookingIdAsync(
        Guid activityId,
        Guid bookingId,
        CancellationToken cancellationToken = default);

    Task<int> GetTotalRoomsAssignedAsync(Guid activityId, Guid? excludeBookingId = null, CancellationToken cancellationToken = default);

    Task<int> GetTotalRoomsForBookingAsync(
        Guid activityId,
        Guid bookingId,
        CancellationToken cancellationToken = default);

    Task<List<TourInstanceBookingRoomAssignmentEntity>> GetByBookingIdAsync(
        Guid bookingId,
        CancellationToken cancellationToken = default);
}
