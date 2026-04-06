using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class BookingActivityReservationRepository(AppDbContext context)
    : Repository<BookingActivityReservationEntity>(context), IBookingActivityReservationRepository
{
    public async Task<IReadOnlyList<BookingActivityReservationEntity>> GetByBookingIdAsync(Guid bookingId)
    {
        return await _dbSet
            .Where(x => x.BookingId == bookingId)
            .OrderBy(x => x.Order)
            .ToListAsync();
    }
}
