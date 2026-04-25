namespace Application.Features.Public.Queries;

using Application.Common.Constant;
using Application.Common.Localization;
using Application.Common;
using Application.Contracts.Public;
using Application.Features.Public.Queries;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Contracts;
using Domain.Common.Repositories;
using Domain.Entities.Translations;
using Domain.Entities;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;


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
                0m,
                t.IsVisa);
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


public sealed class SearchToursQueryValidator : AbstractValidator<SearchToursQuery>
{
    public SearchToursQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage(ValidationMessages.SearchToursPageMinimum1);

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50)
            .WithMessage(ValidationMessages.SearchToursPageSizeRange);

        RuleFor(x => x.People)
            .InclusiveBetween(1, 50)
            .When(x => x.People.HasValue)
            .WithMessage(ValidationMessages.SearchToursPeopleRange);

        RuleFor(x => x.MinPrice)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MinPrice.HasValue)
            .WithMessage(ValidationMessages.SearchToursMinPriceMinimum0);

        RuleFor(x => x.MaxPrice)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MaxPrice.HasValue)
            .WithMessage(ValidationMessages.SearchToursMaxPriceMinimum0);

        RuleFor(x => x.MaxPrice)
            .GreaterThanOrEqualTo(x => x.MinPrice!.Value)
            .When(x => x.MinPrice.HasValue && x.MaxPrice.HasValue)
            .WithMessage(ValidationMessages.SearchToursMaxPriceGreaterThanOrEqualMinPrice);

        RuleFor(x => x.MinDays)
            .GreaterThanOrEqualTo(1)
            .When(x => x.MinDays.HasValue)
            .WithMessage(ValidationMessages.SearchToursMinDaysMinimum1);

        RuleFor(x => x.MaxDays)
            .GreaterThanOrEqualTo(1)
            .When(x => x.MaxDays.HasValue)
            .WithMessage(ValidationMessages.SearchToursMaxDaysMinimum1);

        RuleFor(x => x.MaxDays)
            .GreaterThanOrEqualTo(x => x.MinDays!.Value)
            .When(x => x.MinDays.HasValue && x.MaxDays.HasValue)
            .WithMessage(ValidationMessages.SearchToursMaxDaysGreaterThanOrEqualMinDays);
    }
}
