using Application.Common;
using Application.Common.Localization;
using Contracts.Interfaces;
using Application.Contracts.Public;
using BuildingBlocks.CORS;
using ErrorOr;
using Domain.Common.Repositories;

namespace Application.Features.Public.Queries;

public sealed record GetHomeStatsQuery(string? Language = null) : IQuery<ErrorOr<HomeStatsVm>>, ICacheable
{
    public string ResolvedLanguage => PublicLanguageResolver.Resolve(Language);

    public string CacheKey => $"{Common.CacheKey.Tour}:home-stats:{ResolvedLanguage}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetHomeStatsQueryHandler(
    ITourRepository tourRepository,
    ISystemKeyRepository systemKeyRepository)
    : IQueryHandler<GetHomeStatsQuery, ErrorOr<HomeStatsVm>>
{
    private readonly ITourRepository _tourRepository = tourRepository;
    private readonly ISystemKeyRepository _systemKeyRepository = systemKeyRepository;

    public async Task<ErrorOr<HomeStatsVm>> Handle(GetHomeStatsQuery request, CancellationToken cancellationToken)
    {
        var totalToursTask = _tourRepository.GetTotalActiveTours(cancellationToken);
        var totalDistanceTask = _tourRepository.GetTotalDistanceKm(cancellationToken);
        var travelersKeyTask = _systemKeyRepository.FindByCode("TOTAL_TRAVELERS", cancellationToken);

        try
        {
            await Task.WhenAll(totalToursTask, totalDistanceTask, travelersKeyTask);
        }
        catch (Exception)
        {
            return Error.Unexpected(description: "Failed to load home statistics");
        }

        var totalTours = totalToursTask.Result;
        var totalDistance = totalDistanceTask.Result;
        var travelersKey = travelersKeyTask.Result;

        var totalTravelers = travelersKey?.CodeValue ?? 10000;

        return new HomeStatsVm(totalTravelers, totalTours, totalDistance);
    }
}

