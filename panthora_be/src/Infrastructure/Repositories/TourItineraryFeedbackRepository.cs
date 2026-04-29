using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public sealed class TourItineraryFeedbackRepository(AppDbContext context) : ITourItineraryFeedbackRepository
{
    private readonly AppDbContext _context = context;

    public async Task<TourItineraryFeedbackEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.TourItineraryFeedbacks
            .Include(f => f.Booking)
            .FirstOrDefaultAsync(f => f.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<TourItineraryFeedbackEntity>> ListByInstanceAndDayAsync(
        Guid tourInstanceId,
        Guid tourInstanceDayId,
        CancellationToken cancellationToken = default)
    {
        return await _context.TourItineraryFeedbacks
            .AsNoTracking()
            .Where(f => f.TourInstanceId == tourInstanceId && f.TourInstanceDayId == tourInstanceDayId)
            .OrderBy(f => f.CreatedOnUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(TourItineraryFeedbackEntity entity, CancellationToken cancellationToken = default)
    {
        await _context.TourItineraryFeedbacks.AddAsync(entity, cancellationToken);
    }

    public Task UpdateAsync(TourItineraryFeedbackEntity entity, CancellationToken cancellationToken = default)
    {
        _context.TourItineraryFeedbacks.Update(entity);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(TourItineraryFeedbackEntity entity, CancellationToken cancellationToken = default)
    {
       _context.TourItineraryFeedbacks.Remove(entity);
        return Task.CompletedTask;
    }
}
