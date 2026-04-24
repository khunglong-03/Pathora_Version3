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

public sealed record SearchToursQuery(
    [property: JsonPropertyName("q")] string? Q,
    [property: JsonPropertyName("destination")] string? Destination,
    [property: JsonPropertyName("classification")] string? Classification,
    [property: JsonPropertyName("date")] DateOnly? Date,
    [property: JsonPropertyName("people")] int? People,
    [property: JsonPropertyName("minPrice")] decimal? MinPrice,
    [property: JsonPropertyName("maxPrice")] decimal? MaxPrice,
    [property: JsonPropertyName("minDays")] int? MinDays,
    [property: JsonPropertyName("maxDays")] int? MaxDays,
    [property: JsonPropertyName("page")] int Page = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonPropertyName("language")] string? Language = null) : IQuery<ErrorOr<PaginatedList<SearchTourVm>>>, ICacheable
{
    public string ResolvedLanguage => PublicLanguageResolver.Resolve(Language);

    public string CacheKey =>
        $"{Common.CacheKey.Tour}:search:{Q}:{Destination}:{Classification}:{Date}:{People}:{MinPrice}:{MaxPrice}:{MinDays}:{MaxDays}:{Page}:{PageSize}:{ResolvedLanguage}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class SearchToursQueryHandler(ITourRepository tourRepository)
    : IQueryHandler<SearchToursQuery, ErrorOr<PaginatedList<SearchTourVm>>>
{
    private readonly ITourRepository _tourRepository = tourRepository;

    public async Task<ErrorOr<PaginatedList<SearchTourVm>>> Handle(SearchToursQuery request, CancellationToken cancellationToken)
    {
        var tours = await _tourRepository.SearchTours(
            request.Q,
            request.Destination,
            request.Classification,
            request.Date,
            request.People,
            request.MinPrice,
            request.MaxPrice,
            request.MinDays,
            request.MaxDays,
            request.Page,
            request.PageSize,
            cancellationToken);

        var total = await _tourRepository.CountSearchTours(
            request.Q,
            request.Destination,
            request.Classification,
            request.Date,
            request.People,
            request.MinPrice,
            request.MaxPrice,
            request.MinDays,
            request.MaxDays,
            cancellationToken);

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
                0m);
        }).ToList();

        return new PaginatedList<SearchTourVm>(total, result, request.Page, request.PageSize);
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
