using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class VisaApplicationRepository(AppDbContext context)
    : Repository<VisaApplicationEntity>(context), IVisaApplicationRepository
{
    public async Task<IReadOnlyList<VisaApplicationEntity>> GetByBookingParticipantIdAsync(Guid bookingParticipantId)
    {
        return await _dbSet
            .Where(x => x.BookingParticipantId == bookingParticipantId)
            .ToListAsync();
    }
}
