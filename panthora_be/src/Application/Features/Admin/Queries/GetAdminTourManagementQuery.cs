using Application.Features.Tour.Queries;
using BuildingBlocks.CORS;
using Contracts;
using Domain.Enums;
using ErrorOr;

namespace Application.Features.Admin.Queries;

public sealed record GetAdminTourManagementQuery(string? SearchText, TourStatus? Status, int PageNumber = 1, int PageSize = 10, Guid? ManagerId = null)
    : IQuery<ErrorOr<PaginatedList<TourVm>>>
{
}

public sealed class GetAdminTourManagementQueryHandler(
        Application.Services.ITourService tourService)
    : IQueryHandler<GetAdminTourManagementQuery, ErrorOr<PaginatedList<TourVm>>>
{
    public async Task<ErrorOr<PaginatedList<TourVm>>> Handle(GetAdminTourManagementQuery request, CancellationToken cancellationToken)
    {
        return await tourService.GetAdminTourManagement(request);
    }
}
