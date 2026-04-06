using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class ReviewRepository(AppDbContext context) : IReviewRepository
{
    private readonly AppDbContext _context = context;

    public async Task<List<ReviewEntity>> GetTopReviews(int limit)
    {
        return await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.Tour)
            .Where(r => r.IsApproved && !r.User.IsDeleted && !r.Tour.IsDeleted)
            .OrderByDescending(r => r.Rating)
            .ThenByDescending(r => r.CreatedOnUtc)
            .Take(limit)
            .ToListAsync();
    }

    public async Task<int> CountReviews()
    {
        return await _context.Reviews
            .Where(r => r.IsApproved)
            .CountAsync();
    }
}
