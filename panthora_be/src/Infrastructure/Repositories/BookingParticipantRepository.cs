using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class BookingParticipantRepository(AppDbContext context)
    : Repository<BookingParticipantEntity>(context), IBookingParticipantRepository
{
    public async Task<IReadOnlyList<BookingParticipantEntity>> GetByBookingIdAsync(Guid bookingId, CancellationToken ct = default)
    {
        return await _dbSet
            .Include(x => x.Passport)
            .Where(x => x.BookingId == bookingId)
            .ToListAsync(ct);
    }
}