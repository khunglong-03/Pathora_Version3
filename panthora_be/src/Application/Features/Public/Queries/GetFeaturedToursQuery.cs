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
        var tours = await _tourRepository.FindFeaturedTours(request.Limit);

        foreach (var tour in tours)
        {
            tour.ApplyResolvedTranslations(request.ResolvedLanguage);
        }

        var result = tours.Select(t =>
        {
            var classification = t.Classifications.FirstOrDefault();
            return new FeaturedTourVm(
                t.Id,
                t.TourName,
                t.Thumbnail?.PublicURL,
                GetMainLocation(t),
                0m,
                classification?.NumberOfDay ?? 0,
                classification?.BasePrice ?? 0m,
                null,
                classification?.Name);
        }).ToList();

        return result;
    }

    private static string? GetMainLocation(TourEntity tour)
    {
        var firstClassification = tour.Classifications.FirstOrDefault();
        if (firstClassification?.Plans == null || !firstClassification.Plans.Any())
            return null;

        var firstDay = firstClassification.Plans.FirstOrDefault();
        if (firstDay?.Activities == null || !firstDay.Activities.Any())
            return null;

        var firstActivity = firstDay.Activities.FirstOrDefault();
        if (firstActivity?.Routes == null || !firstActivity.Routes.Any())
            return null;

        var firstRoute = firstActivity.Routes.FirstOrDefault();
        if (firstRoute == null)
            return null;

        var translation = firstRoute.ResolveTranslation("vi");
        if (!string.IsNullOrWhiteSpace(translation.FromLocationName))
            return translation.FromLocationName;

        return firstRoute.Note;
    }
}

