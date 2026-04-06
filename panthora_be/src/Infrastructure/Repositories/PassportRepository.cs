using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class PassportRepository(AppDbContext context) : Repository<PassportEntity>(context), IPassportRepository
{
    public async Task<PassportEntity?> GetByBookingParticipantIdAsync(Guid bookingParticipantId)
    {
        return await _dbSet.FirstOrDefaultAsync(x => x.BookingParticipantId == bookingParticipantId);
    }
}
