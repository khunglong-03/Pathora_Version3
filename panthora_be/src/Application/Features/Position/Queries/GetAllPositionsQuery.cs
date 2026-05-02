using Application.Common;
using Application.Contracts.Position;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Contracts;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Position.Queries;

public sealed record GetAllPositionsQuery(
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonPropertyName("searchText")] string? SearchText = null)
    : IQuery<ErrorOr<PaginatedListWithPermissions<PositionVm>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.Position}:all:{PageNumber}:{PageSize}:{SearchText}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed class GetAllPositionsQueryHandler(IPositionService positionService)
    : IQueryHandler<GetAllPositionsQuery, ErrorOr<PaginatedListWithPermissions<PositionVm>>>
{
    public async Task<ErrorOr<PaginatedListWithPermissions<PositionVm>>> Handle(GetAllPositionsQuery request, CancellationToken cancellationToken)
    {
        return await positionService.GetAllAsync(new GetAllPositionRequest(request.PageNumber, request.PageSize, request.SearchText));
    }
}

