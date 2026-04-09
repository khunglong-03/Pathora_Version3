namespace Infrastructure.Repositories;

using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

public class GuestArrivalRepository(AppDbContext context)
    : Repository<GuestArrivalEntity>(context), IGuestArrivalRepository
{
    public async Task<GuestArrivalEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(x => x.Participants)
            .ThenInclude(p => p.BookingParticipant)
            .ThenInclude(bp => bp.Passport)
            .Include(x => x.BookingAccommodationDetail)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<GuestArrivalEntity?> FindByAccommodationDetailIdAsync(Guid bookingAccommodationDetailId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(x => x.Participants)
            .ThenInclude(p => p.BookingParticipant)
            .ThenInclude(bp => bp.Passport)
            .FirstOrDefaultAsync(x => x.BookingAccommodationDetailId == bookingAccommodationDetailId, cancellationToken);
    }

    public async Task<IReadOnlyList<GuestArrivalEntity>> GetByHotelAsync(Guid supplierId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(x => x.Participants)
            .Include(x => x.BookingAccommodationDetail)
            .Where(x => x.BookingAccommodationDetail.SupplierId == supplierId)
            .OrderByDescending(x => x.SubmittedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<GuestArrivalEntity>> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(x => x.Participants)
                .ThenInclude(p => p.BookingParticipant)
                    .ThenInclude(bp => bp.Passport)
            .Include(x => x.BookingAccommodationDetail)
            .Where(x => x.BookingAccommodationDetail.BookingActivityReservation.BookingId == bookingId)
            .OrderByDescending(x => x.SubmittedAt)
            .ToListAsync(cancellationToken);
    }

    public override async Task AddAsync(GuestArrivalEntity entity, CancellationToken cancellationToken = default)
    {
        await base.AddAsync(entity, cancellationToken);
    }

    public async Task AddParticipantAsync(GuestArrivalParticipantEntity participant, CancellationToken cancellationToken = default)
    {
        await _context.GuestArrivalParticipants.AddAsync(participant, cancellationToken);
    }
}
