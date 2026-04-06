using Application.Common;
using Contracts;
using Contracts.Interfaces;
using Application.Dtos;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;
using Application.Services;

namespace Application.Features.TourInstance.Queries;

public sealed record GetAllTourInstancesQuery(
    string? SearchText,
    TourInstanceStatus? Status = null,
    int PageNumber = 1,
    int PageSize = 10) : IQuery<ErrorOr<PaginatedList<TourInstanceVm>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.TourInstance}:all:{PageNumber}:{PageSize}:{Status}:{SearchText}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed class GetAllTourInstancesQueryHandler(ITourInstanceService tourInstanceService)
    : IQueryHandler<GetAllTourInstancesQuery, ErrorOr<PaginatedList<TourInstanceVm>>>
{
    public async Task<ErrorOr<PaginatedList<TourInstanceVm>>> Handle(GetAllTourInstancesQuery request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.GetAll(request);
    }
}

