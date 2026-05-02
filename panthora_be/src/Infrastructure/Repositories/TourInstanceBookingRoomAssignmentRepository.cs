using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TourInstanceBookingRoomAssignmentRepository(AppDbContext context)
    : Repository<TourInstanceBookingRoomAssignmentEntity>(context), ITourInstanceBookingRoomAssignmentRepository
{
    public async Task<List<TourInstanceBookingRoomAssignmentEntity>> GetByActivityIdAsync(Guid activityId, CancellationToken cancellationToken = default)
    {
        return await _context.TourInstanceBookingRoomAssignments
            .Where(x => x.TourInstanceDayActivityId == activityId)
            .ToListAsync(cancellationToken);
    }

    public async Task<TourInstanceBookingRoomAssignmentEntity?> GetByActivityAndBookingAsync(Guid activityId, Guid bookingId, CancellationToken cancellationToken = default)
    {
        return await _context.TourInstanceBookingRoomAssignments
            .FirstOrDefaultAsync(x => x.TourInstanceDayActivityId == activityId && x.BookingId == bookingId, cancellationToken);
    }

    public async Task<int> GetTotalRoomsAssignedAsync(Guid activityId, Guid? excludeBookingId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.TourInstanceBookingRoomAssignments
            .Where(x => x.TourInstanceDayActivityId == activityId);

        if (excludeBookingId.HasValue)
            query = query.Where(x => x.BookingId != excludeBookingId.Value);

        return await query.SumAsync(x => (int?)x.RoomCount, cancellationToken) ?? 0;
    }
}
