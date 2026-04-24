using Application.Common;
using Contracts;
using Contracts.Interfaces;
using Application.Dtos;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;
using Application.Services;
using System.Text.Json.Serialization;

namespace Application.Features.TourInstance.Queries;

public sealed record GetAllTourInstancesQuery(
    [property: JsonPropertyName("searchText")] string? SearchText,
    [property: JsonPropertyName("status")] TourInstanceStatus? Status = null,
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonPropertyName("excludePast")] bool ExcludePast = false) : IQuery<ErrorOr<PaginatedList<TourInstanceVm>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.TourInstance}:all:{PageNumber}:{PageSize}:{Status}:{ExcludePast}:{SearchText}";
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

