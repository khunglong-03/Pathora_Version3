using Application.Common;
using Application.Dtos;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Queries;

public sealed record GetTourInstanceStatsQuery() : IQuery<ErrorOr<TourInstanceStatsDto>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.TourInstance}:stats";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetTourInstanceStatsQueryHandler(ITourInstanceService tourInstanceService)
    : IQueryHandler<GetTourInstanceStatsQuery, ErrorOr<TourInstanceStatsDto>>
{
    public async Task<ErrorOr<TourInstanceStatsDto>> Handle(GetTourInstanceStatsQuery request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.GetStats();
    }
}
