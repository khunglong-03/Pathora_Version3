using Application.Dtos;
using Application.Features.TourInstance.Queries;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts;
using ErrorOr;

namespace Application.Features.TourInstance.Handlers;

public sealed class GetMyAssignedTourInstancesQueryHandler(ITourInstanceService tourInstanceService)
    : IQueryHandler<GetMyAssignedTourInstancesQuery, ErrorOr<PaginatedList<TourInstanceVm>>>
{
    public async Task<ErrorOr<PaginatedList<TourInstanceVm>>> Handle(GetMyAssignedTourInstancesQuery request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.GetMyAssignedInstances(request.PageNumber, request.PageSize, cancellationToken);
    }
}
