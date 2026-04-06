using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IReviewRepository
{
    Task<List<ReviewEntity>> GetTopReviews(int limit);
    Task<int> CountReviews();
}
