using Application.Common;
using Application.Dtos;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Contracts;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Tour.Queries;

public sealed record GetMyToursQuery(
    [property: JsonPropertyName("searchText")] string? SearchText,
    [property: JsonPropertyName("status")] TourStatus? Status = null,
    [property: JsonPropertyName("tourScope")] TourScope? TourScope = null,
    [property: JsonPropertyName("continent")] Continent? Continent = null,
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonIgnore] Guid? CurrentUserId = null)
    : IQuery<ErrorOr<PaginatedList<TourVm>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.Tour}:my:{CurrentUserId}:{PageNumber}:{PageSize}:{SearchText}:{Status}:{TourScope}:{Continent}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetMyToursQueryHandler(ITourService tourService)
    : IQueryHandler<GetMyToursQuery, ErrorOr<PaginatedList<TourVm>>>
{
    public async Task<ErrorOr<PaginatedList<TourVm>>> Handle(GetMyToursQuery request, CancellationToken cancellationToken)
    {
        return await tourService.GetMyTours(request);
    }
}
