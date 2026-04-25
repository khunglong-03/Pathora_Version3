using Application.Common;
using Application.Dtos;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Tour.Queries;
public sealed record GetTourDetailQuery([property: JsonPropertyName("id")] Guid Id) : IQuery<ErrorOr<TourDto>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.Tour}:detail:{Id}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed class GetTourDetailQueryHandler(ITourService tourService)
    : IQueryHandler<GetTourDetailQuery, ErrorOr<TourDto>>
{
    public async Task<ErrorOr<TourDto>> Handle(GetTourDetailQuery request, CancellationToken cancellationToken)
    {
        return await tourService.GetDetail(request.Id);
    }
}

