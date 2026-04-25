using Application.Features.Tour.Queries;
using BuildingBlocks.CORS;
using Contracts;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Admin.Queries;
public sealed record GetAdminTourManagementQuery(
    [property: JsonPropertyName("searchText")] string? SearchText,
    [property: JsonPropertyName("status")] TourStatus? Status,
    [property: JsonPropertyName("tourScope")] TourScope? TourScope = null,
    [property: JsonPropertyName("continent")] Continent? Continent = null,
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonPropertyName("managerId")] Guid? ManagerId = null)
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
