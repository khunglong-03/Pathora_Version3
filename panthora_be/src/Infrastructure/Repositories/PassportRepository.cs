using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class PassportRepository(AppDbContext context) : Repository<PassportEntity>(context), IPassportRepository
{
    public async Task<PassportEntity?> GetByBookingParticipantIdAsync(Guid bookingParticipantId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(x => x.BookingParticipantId == bookingParticipantId, cancellationToken);
    }

    public async Task<Dictionary<Guid, PassportEntity>> GetByBookingParticipantIdsAsync(IEnumerable<Guid> bookingParticipantIds, CancellationToken cancellationToken = default)
    {
        var ids = bookingParticipantIds.ToList();
        if (ids.Count == 0)
            return [];

        var passports = await _dbSet
            .AsNoTracking()
            .Where(p => ids.Contains(p.BookingParticipantId))
            .ToListAsync(cancellationToken);

        return passports.ToDictionary(p => p.BookingParticipantId);
    }

    public async Task<PassportEntity?> GetByPassportNumberAsync(string passportNumber, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.PassportNumber == passportNumber, cancellationToken);
    }
}
