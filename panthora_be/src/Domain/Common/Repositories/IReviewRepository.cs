using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IReviewRepository
{
    Task<List<ReviewEntity>> GetTopReviews(int limit, CancellationToken ct = default);
    Task<int> CountReviews(CancellationToken ct = default);
}