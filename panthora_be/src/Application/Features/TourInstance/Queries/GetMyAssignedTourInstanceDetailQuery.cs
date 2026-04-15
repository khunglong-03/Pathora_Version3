using Application.Common;
using Application.Dtos;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;

namespace Application.Features.TourInstance.Queries;

public sealed record GetMyAssignedTourInstanceDetailQuery(Guid Id) : IQuery<ErrorOr<TourInstanceDto>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.TourInstance}:my-assigned-detail:{Id}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}
