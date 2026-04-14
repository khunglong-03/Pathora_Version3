using Application.Common;
using Contracts;
using Contracts.Interfaces;
using Application.Dtos;
using ErrorOr;
using Application.Services;
using BuildingBlocks.CORS;

namespace Application.Features.TourInstance.Queries;

public sealed record GetProviderAssignedTourInstancesQuery(
    int PageNumber = 1,
    int PageSize = 10) : IQuery<ErrorOr<PaginatedList<TourInstanceVm>>>;

public sealed class GetProviderAssignedTourInstancesQueryHandler(ITourInstanceService tourInstanceService)
    : IQueryHandler<GetProviderAssignedTourInstancesQuery, ErrorOr<PaginatedList<TourInstanceVm>>>
{
    public async Task<ErrorOr<PaginatedList<TourInstanceVm>>> Handle(GetProviderAssignedTourInstancesQuery request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.GetProviderAssigned(request.PageNumber, request.PageSize, cancellationToken);
    }
}
