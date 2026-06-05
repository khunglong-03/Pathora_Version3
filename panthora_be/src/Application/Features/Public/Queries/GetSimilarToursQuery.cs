using BuildingBlocks.CORS;
using Application.Common.Localization;
using Application.Common;
using Application.Contracts.Public;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.Entities.Translations;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Public.Queries;

public sealed record GetSimilarToursQuery(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("language")] string? Language = null)
    : IQuery<ErrorOr<List<SearchTourVm>>>, ICacheable
{
    public string ResolvedLanguage => PublicLanguageResolver.Resolve(Language);

    public string CacheKey => $"{Common.CacheKey.Tour}:public:similar:{Id}:{ResolvedLanguage}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetSimilarToursQueryHandler(ITourRepository tourRepository)
    : IQueryHandler<GetSimilarToursQuery, ErrorOr<List<SearchTourVm>>>
{
    private readonly ITourRepository _tourRepository = tourRepository;

    public async Task<ErrorOr<List<SearchTourVm>>> Handle(GetSimilarToursQuery request, CancellationToken cancellationToken)
    {
        // 1. Fetch current tour to compare similarity details
        var currentTour = await _tourRepository.FindById(request.Id, asNoTracking: true, cancellationToken);
        if (currentTour is null || currentTour.IsDeleted || currentTour.Status != TourStatus.Active)
        {
            return Error.NotFound("Tour.NotFound", "Không tìm thấy tour du lịch hợp lệ.");
        }

        // Apply translations for the current tour
        currentTour.ApplyResolvedTranslations(request.ResolvedLanguage);

        var targetLocation = GetMainLocation(currentTour, request.ResolvedLanguage);
        var targetClassification = currentTour.Classifications.FirstOrDefault()?.Name;

        // 2. Fetch active tours from repository (first page, up to 100 items)
        var allTours = await _tourRepository.FindAll(
            searchText: null,
            pageNumber: 1,
            pageSize: 100,
            status: TourStatus.Active,
            cancellationToken: cancellationToken);

        // 3. Score and filter tours in-memory
        var scoredTours = allTours
            .Where(t => t.Id != request.Id) // Exclude current tour
            .Select(t =>
            {
                t.ApplyResolvedTranslations(request.ResolvedLanguage);
                var location = GetMainLocation(t, request.ResolvedLanguage);
                var classification = t.Classifications.FirstOrDefault();

                int score = 0;

                // Match Location (+3 points)
                if (!string.IsNullOrWhiteSpace(targetLocation) && !string.IsNullOrWhiteSpace(location) &&
                    string.Equals(targetLocation.Trim(), location.Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    score += 3;
                }

                // Match Classification (+2 points)
                if (!string.IsNullOrWhiteSpace(targetClassification) && classification != null && !string.IsNullOrWhiteSpace(classification.Name) &&
                    string.Equals(targetClassification.Trim(), classification.Name.Trim(), StringComparison.OrdinalIgnoreCase))
                {
                    score += 2;
                }

                return new
                {
                    Tour = t,
                    Score = score,
                    Classification = classification,
                    Location = location
                };
            })
            .OrderByDescending(x => x.Score)
            .ThenByDescending(x => x.Tour.CreatedOnUtc) // Fallback sorting by newest
            .Take(3)
            .ToList();

        // 4. Map entities to SearchTourVm DTOs
        var result = scoredTours.Select(x => new SearchTourVm(
            x.Tour.Id,
            x.Tour.TourName,
            x.Tour.Thumbnail?.PublicURL,
            x.Tour.ShortDescription,
            x.Location,
            x.Classification?.NumberOfDay ?? 0,
            x.Classification?.BasePrice ?? 0,
            x.Classification?.Name,
            0m,
            x.Tour.IsVisa
        )).ToList();

        return result;
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
