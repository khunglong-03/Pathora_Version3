using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
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
                .ThenInclude(ti => ti.Tour)
            .Include(b => b.TourInstance)
                .ThenInclude(ti => ti.Thumbnail)
            .Include(b => b.User)
            .Include(b => b.TourRequest)
            .Include(b => b.Deposits)
            .Include(b => b.Payments)
            .Include(b => b.PaymentTransactions)
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

    public async Task<(List<BookingEntity> Items, int TotalCount)> GetPagedForManagerAsync(
        Guid managerId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var designerIds = await _context.TourManagerAssignments
            .AsNoTracking()
            .Where(a => a.TourManagerId == managerId
                        && a.AssignedEntityType == AssignedEntityType.TourOperator
                        && a.AssignedUserId != null)
            .Select(a => a.AssignedUserId!.Value)
            .ToListAsync(cancellationToken);

        if (!designerIds.Contains(managerId))
        {
            designerIds.Add(managerId);
        }

        var allowedTourIds = _context.Tours
            .AsNoTracking()
            .Where(t => !t.IsDeleted
                        && t.TourOperatorId.HasValue
                        && designerIds.Contains(t.TourOperatorId.Value))
            .Select(t => t.Id);

        var allowedInstanceIds = _context.TourInstanceManagers
            .AsNoTracking()
            .Where(m => m.UserId == managerId)
            .Select(m => m.TourInstanceId);

        var query = _context.Bookings
            .AsNoTracking()
            .Include(b => b.TourInstance)
            .Include(b => b.User)
            .Where(b => !b.TourInstance.IsDeleted
                        && (allowedTourIds.Contains(b.TourInstance.TourId)
                            || allowedInstanceIds.Contains(b.TourInstanceId)))
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

    public Task UpdateWithoutSaveAsync(BookingEntity booking)
    {
        _context.Bookings.Update(booking);
        return Task.CompletedTask;
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

    public async Task<(List<BookingEntity> Items, int TotalCount)> GetPagedBookingsForUserAsync(
        string userIdStr,
        string? statusFilter,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Bookings
            .AsNoTracking()
            .Include(b => b.TourInstance)
                .ThenInclude(ti => ti.Thumbnail)
            .Include(b => b.PaymentTransactions)
            .Where(b => b.CreatedBy == userIdStr || (b.UserId != null && b.UserId.ToString() == userIdStr));

        if (!string.IsNullOrWhiteSpace(statusFilter))
        {
            if (statusFilter.Equals("pending_approval", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(b => b.TourInstance != null && b.TourInstance.Status == Domain.Enums.TourInstanceStatus.PendingCustomerApproval);
            }
            else if (Enum.TryParse<Domain.Enums.BookingStatus>(statusFilter, true, out var parsedStatus))
            {
                query = query.Where(b => b.Status == parsedStatus);
            }
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(b => b.CreatedOnUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<BookingEntity?> GetByParticipantIdAsync(Guid participantId, CancellationToken cancellationToken = default)
    {
        return await _context.Bookings
            .Include(b => b.TourInstance)
                .ThenInclude(ti => ti!.Tour)
            .Include(b => b.BookingParticipants)
            .Include(b => b.PaymentTransactions)
            .AsSplitQuery()
            .FirstOrDefaultAsync(
                b => b.BookingParticipants.Any(p => p.Id == participantId),
                cancellationToken);
    }
}
