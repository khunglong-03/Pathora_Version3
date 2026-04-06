using Application.Common;
using Application.Common.Localization;
using Contracts.Interfaces;
using Application.Contracts.Public;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities.Translations;
using ErrorOr;

namespace Application.Features.Public.Queries;

public sealed record GetTopAttractionsQuery(int Limit = 8, string? Language = null) : IQuery<ErrorOr<List<TopAttractionVm>>>, ICacheable
{
    public string ResolvedLanguage => PublicLanguageResolver.Resolve(Language);

    public string CacheKey => $"{Common.CacheKey.Tour}:top-attractions:{Limit}:{ResolvedLanguage}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetTopAttractionsQueryHandler(ITourRepository tourRepository)
    : IQueryHandler<GetTopAttractionsQuery, ErrorOr<List<TopAttractionVm>>>
{
    private readonly ITourRepository _tourRepository = tourRepository;

    public async Task<ErrorOr<List<TopAttractionVm>>> Handle(GetTopAttractionsQuery request, CancellationToken cancellationToken)
    {
        var attractions = await _tourRepository.GetTopAttractions(request.Limit);

        foreach (var attraction in attractions)
        {
            attraction.ApplyResolvedTranslation(request.ResolvedLanguage);
        }

        var result = attractions.Select(a => new TopAttractionVm(
            a.LocationName,
            a.Address,
            null,
            a.City ?? string.Empty,
            a.Country ?? string.Empty)).ToList();

        return result;
    }
}
