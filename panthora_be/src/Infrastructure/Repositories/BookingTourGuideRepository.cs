using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class BookingTourGuideRepository(AppDbContext context)
    : Repository<BookingTourGuideEntity>(context), IBookingTourGuideRepository
{
    public async Task<IReadOnlyList<BookingTourGuideEntity>> GetByBookingIdAsync(Guid bookingId)
    {
        return await _dbSet
            .Where(x => x.BookingId == bookingId)
            .OrderByDescending(x => x.IsLead)
            .ThenBy(x => x.AssignedDate)
            .ToListAsync();
    }

    public async Task<BookingTourGuideEntity?> GetByBookingIdAndUserIdAsync(Guid bookingId, Guid userId)
    {
        return await _dbSet
            .FirstOrDefaultAsync(x => x.BookingId == bookingId && x.UserId == userId);
    }
}
