using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class BookingTourGuideRepository(AppDbContext context)
    : Repository<BookingTourGuideEntity>(context), IBookingTourGuideRepository
{
    public async Task<IReadOnlyList<BookingTourGuideEntity>> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => x.BookingId == bookingId)
            .OrderByDescending(x => x.IsLead)
            .ThenBy(x => x.AssignedDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<BookingTourGuideEntity?> GetByBookingIdAndUserIdAsync(Guid bookingId, Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(x => x.BookingId == bookingId && x.UserId == userId, cancellationToken);
    }
}
