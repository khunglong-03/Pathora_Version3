using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public sealed class BookingCancellationRequestRepository(AppDbContext context) : IBookingCancellationRequestRepository
{
    private readonly AppDbContext _context = context;

    public async Task<BookingCancellationRequestEntity?> GetPendingByBookingId(
        Guid bookingId,
        CancellationToken cancellationToken = default)
    {
        return await _context.BookingCancellationRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(
                request => request.BookingId == bookingId &&
                           request.Status == BookingCancellationRequestStatus.PendingManagerReview,
                cancellationToken);
    }

    public async Task<List<BookingCancellationRequestEntity>> GetByBookingIdAsync(
        Guid bookingId,
        CancellationToken cancellationToken = default)
    {
        return await _context.BookingCancellationRequests
            .AsNoTracking()
            .Where(r => r.BookingId == bookingId)
            .ToListAsync(cancellationToken);
    }

    public async Task<BookingCancellationRequestEntity?> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _context.BookingCancellationRequests
            .FirstOrDefaultAsync(request => request.Id == id, cancellationToken);
    }

    public async Task Add(
        BookingCancellationRequestEntity entity,
        CancellationToken cancellationToken = default)
    {
        await _context.BookingCancellationRequests.AddAsync(entity, cancellationToken);
    }

    public async Task<(List<BookingCancellationRequestEntity> Items, int TotalCount)> GetPagedByUserIdAsync(
        Guid userId,
        BookingCancellationRequestStatus? status,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.BookingCancellationRequests
            .AsNoTracking()
            .Include(r => r.Booking)
                .ThenInclude(b => b.TourInstance)
            .Where(r => r.RequestedByUserId == userId);

        if (status.HasValue)
            query = query.Where(r => r.Status == status.Value);

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }

    public async Task<(List<BookingCancellationRequestEntity> Items, int TotalCount)> GetPagedForManagerAsync(
        BookingCancellationRequestStatus? status,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _context.BookingCancellationRequests
            .AsNoTracking()
            .Include(r => r.Booking)
                .ThenInclude(b => b.TourInstance)
                    .ThenInclude(i => i != null ? i.Tour : null)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(r => r.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lower = search.ToLower();
            query = query.Where(r =>
                r.Booking.CustomerName.ToLower().Contains(lower) ||
                r.Booking.CustomerPhone.Contains(lower) ||
                (r.Booking.CustomerEmail != null && r.Booking.CustomerEmail.ToLower().Contains(lower)) ||
                r.Booking.TourInstance.TourName.ToLower().Contains(lower));
        }

        var total = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }
}
