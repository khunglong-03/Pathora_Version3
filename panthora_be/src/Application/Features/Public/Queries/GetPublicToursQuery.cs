using Application.Common;
using Application.Common.Localization;
using Application.Contracts.Public;
using Contracts;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Entities.Translations;
using System.Text.Json.Serialization;

namespace Application.Features.Public.Queries;

public sealed record GetPublicToursQuery(
    [property: JsonPropertyName("searchText")] string? SearchText,
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonPropertyName("language")] string? Language = null)
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
            request.PageSize,
            cancellationToken: cancellationToken);

        var totalCount = await _tourRepository.CountAll(request.SearchText, cancellationToken: cancellationToken);

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
                GetMainLocation(t, request.ResolvedLanguage),
                classification?.NumberOfDay ?? 0,
                classification?.BasePrice ?? 0,
                classification?.Name,
                0m,
                t.IsVisa);
        }).ToList();

        return new PaginatedList<SearchTourVm>(totalCount, result, request.PageNumber, request.PageSize);
    }

    private static string? GetMainLocation(TourEntity tour, string language)
    {
        var location = tour.PlanLocations.FirstOrDefault();
        if (location == null)
            return null;

        if (location.Translations.TryGetValue(language, out var translation)
            && !string.IsNullOrWhiteSpace(translation.LocationName))
        {
            return translation.LocationName;
        }

        if (!string.IsNullOrWhiteSpace(location.LocationName))
            return location.LocationName;

        return location.City;
    }
}
