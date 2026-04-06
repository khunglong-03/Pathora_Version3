using Application.Common;
using Application.Common.Localization;
using Contracts.Interfaces;
using Application.Contracts.Public;
using BuildingBlocks.CORS;
using ErrorOr;
using Domain.Common.Repositories;

namespace Application.Features.Public.Queries;

public sealed record GetTrendingDestinationsQuery(int Limit = 6, string? Language = null) : IQuery<ErrorOr<List<TrendingDestinationVm>>>, ICacheable
{
    public string ResolvedLanguage => PublicLanguageResolver.Resolve(Language);

    public string CacheKey => $"{Common.CacheKey.Tour}:trending:{Limit}:{ResolvedLanguage}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetTrendingDestinationsQueryHandler(ITourRepository tourRepository)
    : IQueryHandler<GetTrendingDestinationsQuery, ErrorOr<List<TrendingDestinationVm>>>
{
    private readonly ITourRepository _tourRepository = tourRepository;

    public async Task<ErrorOr<List<TrendingDestinationVm>>> Handle(GetTrendingDestinationsQuery request, CancellationToken cancellationToken)
    {
        var destinations = await _tourRepository.GetTrendingDestinations(request.Limit);

        var result = destinations.Select(d => new TrendingDestinationVm(
            d.City,
            d.Country,
            null,
            d.ToursCount)).ToList();

        return result;
    }
}

