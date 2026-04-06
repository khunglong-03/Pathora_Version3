using Application.Common;
using Application.Contracts.Public;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Domain.Common.Repositories;

namespace Application.Features.Public.Queries;

public sealed record GetTopReviewsQuery(int Limit = 6) : IQuery<ErrorOr<List<TopReviewVm>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.Tour}:top-reviews:{Limit}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetTopReviewsQueryHandler(IReviewRepository reviewRepository)
    : IQueryHandler<GetTopReviewsQuery, ErrorOr<List<TopReviewVm>>>
{
    private readonly IReviewRepository _reviewRepository = reviewRepository;

    public async Task<ErrorOr<List<TopReviewVm>>> Handle(GetTopReviewsQuery request, CancellationToken cancellationToken)
    {
        var reviews = await _reviewRepository.GetTopReviews(request.Limit);

        var result = reviews.Select(r => new TopReviewVm(
            r.User.Username,
            r.User.AvatarUrl,
            r.Tour.TourName,
            r.Rating,
            r.Comment,
            r.CreatedOnUtc)).ToList();

        return result;
    }
}
