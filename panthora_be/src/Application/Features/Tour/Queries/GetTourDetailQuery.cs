using Application.Common;
using Application.Dtos;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Services;

namespace Application.Features.Tour.Queries;

public sealed record GetTourDetailQuery(Guid Id) : IQuery<ErrorOr<TourDto>>, ICacheable
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

