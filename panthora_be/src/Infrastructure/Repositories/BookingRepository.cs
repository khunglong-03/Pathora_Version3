using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class BookingRepository(AppDbContext context) : IBookingRepository
{
    private readonly AppDbContext _context = context;

    public async Task<BookingEntity?> GetByIdAsync(Guid id)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Include(b => b.TourInstance)
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<BookingEntity?> GetByIdWithDetailsAsync(Guid id)
    {
        return await _context.Bookings
            .Include(b => b.TourInstance)
            .Include(b => b.User)
            .Include(b => b.TourRequest)
            .Include(b => b.Deposits)
            .Include(b => b.Payments)
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<List<BookingEntity>> GetByTourInstanceIdAsync(Guid tourInstanceId)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Include(b => b.User)
            .Include(b => b.TourInstance)
            .Where(b => b.TourInstanceId == tourInstanceId)
            .OrderByDescending(b => b.BookingDate)
            .ToListAsync();
    }

    public async Task<List<BookingEntity>> GetByUserIdAsync(Guid userId)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Include(b => b.TourInstance).ThenInclude(ti => ti.Thumbnail)
            .Include(b => b.TourInstance).ThenInclude(ti => ti.Images)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.BookingDate)
            .ToListAsync();
    }

    public async Task<int> CountByTourInstanceIdAsync(Guid tourInstanceId)
    {
        return await _context.Bookings
            .Where(b => b.TourInstanceId == tourInstanceId && b.Status != Domain.Enums.BookingStatus.Cancelled)
            .SumAsync(b => b.NumberAdult + b.NumberChild + b.NumberInfant);
    }

    public async Task<List<BookingEntity>> GetRecentByUserIdAsync(Guid userId, int count)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Include(b => b.TourInstance)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.BookingDate)
            .Take(count)
            .ToListAsync();
    }

    public async Task<(List<BookingEntity> Items, int TotalCount)> GetAllPagedAsync(int page, int pageSize)
    {
        var query = _context.Bookings.AsNoTracking().Include(b => b.TourInstance);

        var totalCount = await query.CountAsync();
        var items = await query
            .OrderByDescending(b => b.BookingDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }

    public async Task AddAsync(BookingEntity booking)
    {
        await _context.Bookings.AddAsync(booking);
    }

    public async Task UpdateAsync(BookingEntity booking)
    {
        _context.Bookings.Update(booking);
        await _context.SaveChangesAsync();
    }

    public async Task<BookingEntity?> GetByPaymentTransactionCodeAsync(string transactionCode)
    {
        return await _context.Bookings
            .Include(b => b.PaymentTransactions)
            .FirstOrDefaultAsync(b => b.PaymentTransactions.Any(pt => pt.TransactionCode == transactionCode));
    }
}
