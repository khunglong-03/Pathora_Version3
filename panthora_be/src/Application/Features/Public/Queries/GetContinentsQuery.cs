using Application.Common;
using Application.Contracts.Public;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Public.Queries;

public sealed record GetContinentsQuery : IQuery<ErrorOr<List<Continent>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.Tour}:continents";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed class GetContinentsQueryHandler(ITourRepository tourRepository)
    : IQueryHandler<GetContinentsQuery, ErrorOr<List<Continent>>>
{
    private readonly ITourRepository _tourRepository = tourRepository;

    public async Task<ErrorOr<List<Continent>>> Handle(GetContinentsQuery request, CancellationToken cancellationToken)
    {
        var continents = await _tourRepository.GetContinentsWithTours(cancellationToken);
        return continents;
    }
}
