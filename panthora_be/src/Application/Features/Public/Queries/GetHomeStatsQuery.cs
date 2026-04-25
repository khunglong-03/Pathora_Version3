using Application.Common.Localization;
using Application.Common;
using Application.Contracts.Public;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using ErrorOr;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;

namespace Application.Features.Public.Queries;
public sealed record GetHomeStatsQuery([property: JsonPropertyName("language")] string? Language = null) : IQuery<ErrorOr<HomeStatsVm>>, ICacheable
{
    public string ResolvedLanguage => PublicLanguageResolver.Resolve(Language);

    public string CacheKey => $"{Common.CacheKey.Tour}:home-stats:{ResolvedLanguage}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetHomeStatsQueryHandler(
    ITourRepository tourRepository,
    ISystemKeyRepository systemKeyRepository,
    ILogger<GetHomeStatsQueryHandler> logger)
    : IQueryHandler<GetHomeStatsQuery, ErrorOr<HomeStatsVm>>
{
    private readonly ITourRepository _tourRepository = tourRepository;
    private readonly ISystemKeyRepository _systemKeyRepository = systemKeyRepository;
    private readonly ILogger<GetHomeStatsQueryHandler> _logger = logger;

    public async Task<ErrorOr<HomeStatsVm>> Handle(GetHomeStatsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            // EF Core DbContext is not thread-safe — queries must run sequentially
            // when sharing the same scoped DbContext instance.
            var totalTours = await _tourRepository.GetTotalActiveTours(cancellationToken);
            var totalDistance = await _tourRepository.GetTotalDistanceKm(cancellationToken);
            var travelersKey = await _systemKeyRepository.FindByCode("TOTAL_TRAVELERS", cancellationToken);

            var totalTravelers = travelersKey?.CodeValue ?? 10000;

            return new HomeStatsVm(totalTravelers, totalTours, totalDistance);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load home statistics");
            return Error.Unexpected(description: "Failed to load home statistics");
        }
    }
}

