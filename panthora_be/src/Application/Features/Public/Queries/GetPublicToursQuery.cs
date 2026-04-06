using Application.Common;
using Application.Common.Localization;
using Application.Contracts.Public;
using Application.Features.Tour.Queries;
using Application.Services;
using Contracts;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Entities.Translations;

namespace Application.Features.Public.Queries;

public sealed record GetPublicToursQuery(
    string? SearchText,
    int PageNumber = 1,
    int PageSize = 10,
    string? Language = null)
    : IQuery<ErrorOr<PaginatedList<SearchTourVm>>>, ICacheable
{
    public string ResolvedLanguage => PublicLanguageResolver.Resolve(Language);

    public string CacheKey => $"{Common.CacheKey.Tour}:public:{PageNumber}:{PageSize}:{SearchText}:{ResolvedLanguage}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetPublicToursQueryHandler(ITourRepository tourRepository)
    : IQueryHandler<GetPublicToursQuery, ErrorOr<PaginatedList<SearchTourVm>>>
{
    private readonly ITourRepository _tourRepository = tourRepository;

    public async Task<ErrorOr<PaginatedList<SearchTourVm>>> Handle(GetPublicToursQuery request, CancellationToken cancellationToken)
    {
        var tours = await _tourRepository.FindAll(
            request.SearchText,
            request.PageNumber,
            request.PageSize);

        var totalCount = await _tourRepository.CountAll(request.SearchText);

        foreach (var tour in tours)
        {
            tour.ApplyResolvedTranslations(request.ResolvedLanguage);
        }

        var result = tours.Select(t =>
        {
            var classification = t.Classifications.FirstOrDefault();
            return new SearchTourVm(
                t.Id,
                t.TourName,
                t.Thumbnail?.PublicURL,
                t.ShortDescription,
                GetMainLocation(t),
                classification?.NumberOfDay ?? 0,
                classification?.BasePrice ?? 0,
                classification?.Name,
                0m);
        }).ToList();

        return new PaginatedList<SearchTourVm>(totalCount, result, request.PageNumber, request.PageSize);
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
