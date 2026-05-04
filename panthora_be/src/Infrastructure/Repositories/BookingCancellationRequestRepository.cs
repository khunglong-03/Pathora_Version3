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

    public async Task<BookingCancellationRequestEntity?> GetById(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return await _context.BookingCancellationRequests
            .AsNoTracking()
            .FirstOrDefaultAsync(request => request.Id == id, cancellationToken);
    }

    public async Task Add(
        BookingCancellationRequestEntity entity,
        CancellationToken cancellationToken = default)
    {
        await _context.BookingCancellationRequests.AddAsync(entity, cancellationToken);
    }
}
