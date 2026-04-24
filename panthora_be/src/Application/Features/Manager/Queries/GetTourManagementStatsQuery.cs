using Application.Features.Manager.DTOs;
using Application.Services;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Manager.Queries;

public sealed record GetTourManagementStatsQuery(
    [property: JsonPropertyName("searchText")] string? SearchText,
    [property: JsonPropertyName("tourScope")] TourScope? TourScope = null,
    [property: JsonPropertyName("continent")] Continent? Continent = null,
    [property: JsonPropertyName("managerId")] Guid? ManagerId = null) : IQuery<ErrorOr<TourManagementStatsDto>>;

public sealed class GetTourManagementStatsQueryHandler(ITourService tourService)
    : IQueryHandler<GetTourManagementStatsQuery, ErrorOr<TourManagementStatsDto>>
{
    public async Task<ErrorOr<TourManagementStatsDto>> Handle(GetTourManagementStatsQuery request, CancellationToken cancellationToken)
    {
        return await tourService.GetAdminTourManagementStats(request);
    }
}
