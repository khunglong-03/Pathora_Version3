using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class VisaApplicationRepository(AppDbContext context)
    : Repository<VisaApplicationEntity>(context), IVisaApplicationRepository
{
    public async Task<IReadOnlyList<VisaApplicationEntity>> GetByBookingParticipantIdAsync(Guid bookingParticipantId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => x.BookingParticipantId == bookingParticipantId)
            .ToListAsync(cancellationToken);
    }
    
    public async Task<IReadOnlyList<VisaApplicationEntity>> GetByBookingParticipantIdsAsync(IEnumerable<Guid> bookingParticipantIds, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => bookingParticipantIds.Contains(x.BookingParticipantId))
            .ToListAsync(cancellationToken);
    }
    public async Task<VisaApplicationEntity?> GetByIdWithGraphAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(v => v.BookingParticipant)
                .ThenInclude(p => p.Booking)
                    .ThenInclude(b => b.TourInstance)
                        .ThenInclude(ti => ti.Managers)
            .Include(v => v.Passport)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
    }
    
    public async Task<VisaApplicationEntity?> GetByServiceFeeTransactionIdAsync(Guid transactionId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(v => v.ServiceFeeTransactionId == transactionId, cancellationToken);
    }
}
