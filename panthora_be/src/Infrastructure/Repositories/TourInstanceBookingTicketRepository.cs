using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TourInstanceBookingTicketRepository(AppDbContext context) : Repository<TourInstanceBookingTicketEntity>(context), ITourInstanceBookingTicketRepository
{
    public async Task<List<TourInstanceBookingTicketEntity>> GetByActivityIdAsync(Guid activityId, CancellationToken cancellationToken = default)
    {
        return await _context.TourInstanceBookingTickets
            .Where(x => x.TourInstanceDayActivityId == activityId)
            .ToListAsync(cancellationToken);
    }

    public async Task<TourInstanceBookingTicketEntity?> GetByActivityAndBookingAsync(Guid activityId, Guid bookingId, CancellationToken cancellationToken = default)
    {
        return await _context.TourInstanceBookingTickets
            .FirstOrDefaultAsync(x => x.TourInstanceDayActivityId == activityId && x.BookingId == bookingId, cancellationToken);
    }
}
