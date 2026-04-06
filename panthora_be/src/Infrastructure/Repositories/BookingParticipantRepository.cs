using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class BookingParticipantRepository(AppDbContext context)
    : Repository<BookingParticipantEntity>(context), IBookingParticipantRepository
{
    public async Task<IReadOnlyList<BookingParticipantEntity>> GetByBookingIdAsync(Guid bookingId)
    {
        return await _dbSet
            .Where(x => x.BookingId == bookingId)
            .ToListAsync();
    }
}
