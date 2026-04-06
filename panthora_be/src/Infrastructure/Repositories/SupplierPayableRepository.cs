using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SupplierPayableRepository(AppDbContext context)
    : Repository<SupplierPayableEntity>(context), ISupplierPayableRepository
{
    public async Task<IReadOnlyList<SupplierPayableEntity>> GetByBookingIdAsync(Guid bookingId)
    {
        return await _dbSet
            .Where(x => x.BookingId == bookingId)
            .ToListAsync();
    }
}
