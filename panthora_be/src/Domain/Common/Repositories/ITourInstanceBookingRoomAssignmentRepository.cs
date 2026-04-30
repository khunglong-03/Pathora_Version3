using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ITourInstanceBookingRoomAssignmentRepository : IRepository<TourInstanceBookingRoomAssignmentEntity>
{
    Task<List<TourInstanceBookingRoomAssignmentEntity>> GetByActivityIdAsync(Guid activityId, CancellationToken cancellationToken = default);
    Task<TourInstanceBookingRoomAssignmentEntity?> GetByActivityAndBookingAsync(Guid activityId, Guid bookingId, CancellationToken cancellationToken = default);
    Task<int> GetTotalRoomsAssignedAsync(Guid activityId, Guid? excludeBookingId = null, CancellationToken cancellationToken = default);
}
