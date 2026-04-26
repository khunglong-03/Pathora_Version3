using Application.Dtos;
using Application.Features.TourInstance.Queries;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.TourInstance.Handlers;

public sealed class GetMyAssignedTourInstanceDetailQueryHandler(ITourInstanceService tourInstanceService)
    : IQueryHandler<GetMyAssignedTourInstanceDetailQuery, ErrorOr<TourInstanceDto>>
{
    public async Task<ErrorOr<TourInstanceDto>> Handle(GetMyAssignedTourInstanceDetailQuery request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.GetMyAssignedInstanceDetail(request.Id, cancellationToken);
    }
}
