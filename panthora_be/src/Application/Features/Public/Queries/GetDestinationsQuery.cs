using Application.Common;
using Application.Contracts.Public;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Public.Queries;
public sealed record GetDestinationsQuery : IQuery<ErrorOr<List<string>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.Tour}:destinations";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed class GetDestinationsQueryHandler(ITourRepository tourRepository)
    : IQueryHandler<GetDestinationsQuery, ErrorOr<List<string>>>
{
    private readonly ITourRepository _tourRepository = tourRepository;

    public async Task<ErrorOr<List<string>>> Handle(GetDestinationsQuery request, CancellationToken cancellationToken)
    {
        var destinations = await _tourRepository.GetAllDestinations(cancellationToken);
        return destinations;
    }
}
