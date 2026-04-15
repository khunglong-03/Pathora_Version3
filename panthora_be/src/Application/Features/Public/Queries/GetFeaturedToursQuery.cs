using Application.Common;
using Application.Common.Localization;
using Contracts.Interfaces;
using Application.Contracts.Public;
using BuildingBlocks.CORS;
using ErrorOr;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Entities.Translations;

namespace Application.Features.Public.Queries;

public sealed record GetFeaturedToursQuery(int Limit = 8, string? Language = null) : IQuery<ErrorOr<List<FeaturedTourVm>>>, ICacheable
{
    public string ResolvedLanguage => PublicLanguageResolver.Resolve(Language);

    public string CacheKey => $"{Common.CacheKey.Tour}:featured:{Limit}:{ResolvedLanguage}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetFeaturedToursQueryHandler(ITourRepository tourRepository)
    : IQueryHandler<GetFeaturedToursQuery, ErrorOr<List<FeaturedTourVm>>>
{
    private readonly ITourRepository _tourRepository = tourRepository;

    public async Task<ErrorOr<List<FeaturedTourVm>>> Handle(GetFeaturedToursQuery request, CancellationToken cancellationToken)
    {
        var tours = await _tourRepository.FindFeaturedTours(request.Limit, cancellationToken);

        foreach (var tour in tours)
        {
            tour.ApplyResolvedTranslations(request.ResolvedLanguage);
        }

        var result = tours.Select(t =>
        {
            var classification = t.Classifications
                .Where(c => !c.IsDeleted)
                .OrderBy(c => c.BasePrice)
                .FirstOrDefault();

            return new FeaturedTourVm(
                t.Id,
                t.TourName,
                t.Thumbnail?.PublicURL,
                GetMainLocation(t, request.ResolvedLanguage),
                0m,
                classification?.NumberOfDay ?? 0,
                classification?.BasePrice ?? 0m,
                null,
                classification?.Name);
        }).ToList();

        return result;
    }

    private static string? GetMainLocation(TourEntity tour, string language)
    {
        var location = tour.PlanLocations.OrderBy(l => l.Id).FirstOrDefault();
        if (location == null)
            return null;

        // Try translated name first
        if (location.Translations.TryGetValue(language, out var translation)
            && !string.IsNullOrWhiteSpace(translation.LocationName))
        {
            return translation.LocationName;
        }

        // Fall back to the default location name or city
        if (!string.IsNullOrWhiteSpace(location.LocationName))
            return location.LocationName;

        return location.City;
    }
}

