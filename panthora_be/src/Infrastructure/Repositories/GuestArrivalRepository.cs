namespace Infrastructure.Repositories;

using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

public class GuestArrivalRepository(AppDbContext context)
    : Repository<GuestArrivalEntity>(context), IGuestArrivalRepository
{
    public async Task<GuestArrivalEntity?> FindByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(x => x.Participants)
            .ThenInclude(p => p.BookingParticipant)
            .ThenInclude(bp => bp.Passport)
            .Include(x => x.BookingAccommodationDetail)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<GuestArrivalEntity?> FindByAccommodationDetailIdAsync(Guid bookingAccommodationDetailId)
    {
        return await _dbSet
            .Include(x => x.Participants)
            .ThenInclude(p => p.BookingParticipant)
            .ThenInclude(bp => bp.Passport)
            .FirstOrDefaultAsync(x => x.BookingAccommodationDetailId == bookingAccommodationDetailId);
    }

    public async Task<IReadOnlyList<GuestArrivalEntity>> GetByHotelAsync(Guid supplierId)
    {
        return await _dbSet
            .Include(x => x.Participants)
            .Include(x => x.BookingAccommodationDetail)
            .Where(x => x.BookingAccommodationDetail.SupplierId == supplierId)
            .OrderByDescending(x => x.SubmittedAt)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<GuestArrivalEntity>> GetByBookingIdAsync(Guid bookingId)
    {
        return await _dbSet
            .Include(x => x.Participants)
                .ThenInclude(p => p.BookingParticipant)
                    .ThenInclude(bp => bp.Passport)
            .Include(x => x.BookingAccommodationDetail)
            .Where(x => x.BookingAccommodationDetail.BookingActivityReservation.BookingId == bookingId)
            .OrderByDescending(x => x.SubmittedAt)
            .ToListAsync();
    }

    public async Task AddParticipantAsync(GuestArrivalParticipantEntity participant)
    {
        await _context.GuestArrivalParticipants.AddAsync(participant);
    }
}
