using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class BookingAccommodationDetailRepository(AppDbContext context)
    : Repository<BookingAccommodationDetailEntity>(context), IBookingAccommodationDetailRepository
{
    public async Task<IReadOnlyList<BookingAccommodationDetailEntity>> GetByBookingActivityReservationIdAsync(Guid bookingActivityReservationId)
    {
        return await _dbSet
            .Where(x => x.BookingActivityReservationId == bookingActivityReservationId)
            .ToListAsync();
    }
}
