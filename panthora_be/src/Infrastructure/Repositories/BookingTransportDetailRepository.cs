using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class BookingTransportDetailRepository(AppDbContext context)
    : Repository<BookingTransportDetailEntity>(context), IBookingTransportDetailRepository
{
    public async Task<IReadOnlyList<BookingTransportDetailEntity>> GetByBookingActivityReservationIdAsync(Guid bookingActivityReservationId)
    {
        return await _dbSet
            .Where(x => x.BookingActivityReservationId == bookingActivityReservationId)
            .ToListAsync();
    }
}
