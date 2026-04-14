using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class BookingRepository(AppDbContext context) : IBookingRepository
{
    private readonly AppDbContext _context = context;

    public async Task<BookingEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Include(b => b.TourInstance)
            .AsSplitQuery()
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task<BookingEntity?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .Include(b => b.TourInstance)
            .Include(b => b.User)
            .Include(b => b.TourRequest)
            .Include(b => b.Deposits)
            .Include(b => b.Payments)
            .AsSplitQuery()
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task<List<BookingEntity>> GetByTourInstanceIdAsync(Guid tourInstanceId, CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Include(b => b.User)
            .Include(b => b.TourInstance)
            .Where(b => b.TourInstanceId == tourInstanceId)
            .OrderByDescending(b => b.BookingDate)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
    }

    public async Task<List<BookingEntity>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Include(b => b.TourInstance).ThenInclude(ti => ti.Thumbnail)
            .Include(b => b.TourInstance).ThenInclude(ti => ti.Images)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.BookingDate)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountByTourInstanceIdAsync(Guid tourInstanceId, CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .Where(b => b.TourInstanceId == tourInstanceId && b.Status != Domain.Enums.BookingStatus.Cancelled)
            .SumAsync(b => b.NumberAdult + b.NumberChild + b.NumberInfant, cancellationToken);
    }

    public async Task<List<BookingEntity>> GetRecentByUserIdAsync(Guid userId, int count, CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .AsNoTracking()
            .Include(b => b.TourInstance)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.BookingDate)
            .Take(count)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
    }

    public async Task<(List<BookingEntity> Items, int TotalCount)> GetAllPagedAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _context.Bookings
            .AsNoTracking()
            .Include(b => b.TourInstance)
            .Include(b => b.User)
            .AsSplitQuery();

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(b => b.BookingDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task AddAsync(BookingEntity booking, CancellationToken cancellationToken = default)
    {
        await _context.Bookings.AddAsync(booking, cancellationToken);
    }

    public async Task UpdateAsync(BookingEntity booking, CancellationToken cancellationToken = default)
    {
        _context.Bookings.Update(booking);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<BookingEntity?> GetByPaymentTransactionCodeAsync(string transactionCode, CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .Include(b => b.PaymentTransactions)
            .AsSplitQuery()
            .FirstOrDefaultAsync(b => b.PaymentTransactions.Any(pt => pt.TransactionCode == transactionCode), cancellationToken);
    }
}
