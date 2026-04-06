using Application.Common;
using Application.Dtos;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Services;

namespace Application.Features.TourInstance.Queries;

public sealed record GetTourInstanceDetailQuery(Guid Id) : IQuery<ErrorOr<TourInstanceDto>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.TourInstance}:detail:{Id}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed class GetTourInstanceDetailQueryHandler(ITourInstanceService tourInstanceService)
    : IQueryHandler<GetTourInstanceDetailQuery, ErrorOr<TourInstanceDto>>
{
    public async Task<ErrorOr<TourInstanceDto>> Handle(GetTourInstanceDetailQuery request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.GetDetail(request.Id);
    }
}

