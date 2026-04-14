using Application.Features.Manager.DTOs;
using Application.Services;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;

namespace Application.Features.Manager.Queries;

public sealed record GetTourManagementStatsQuery(
    string? SearchText,
    TourScope? TourScope = null,
    Continent? Continent = null,
    Guid? ManagerId = null
) : IQuery<ErrorOr<TourManagementStatsDto>>;

public sealed class GetTourManagementStatsQueryHandler(ITourService tourService)
    : IQueryHandler<GetTourManagementStatsQuery, ErrorOr<TourManagementStatsDto>>
{
    public async Task<ErrorOr<TourManagementStatsDto>> Handle(GetTourManagementStatsQuery request, CancellationToken cancellationToken)
    {
        return await tourService.GetAdminTourManagementStats(request);
    }
}
