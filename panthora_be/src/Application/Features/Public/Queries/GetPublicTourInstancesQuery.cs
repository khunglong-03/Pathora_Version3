using Application.Common.Localization;
using Application.Common;
using Application.Dtos;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Contracts;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Public.Queries;

public sealed record GetPublicTourInstancesQuery(
    [property: JsonPropertyName("destination")] string? Destination = null,
    [property: JsonPropertyName("sortBy")] string? SortBy = null,
    [property: JsonPropertyName("page")] int Page = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonPropertyName("language")] string? Language = null,
    /// <summary>Omit or <c>public</c>: scheduled public departures (default). <c>private</c>: private departures open for booking.</summary>
    [property: JsonPropertyName("instanceType")] string? InstanceType = null) : IQuery<ErrorOr<PaginatedList<TourInstanceVm>>>, ICacheable
{
    public string ResolvedLanguage => PublicLanguageResolver.Resolve(Language);

    public string CacheKey => $"{Common.CacheKey.TourInstance}:public:list:{Destination}:{SortBy}:{Page}:{PageSize}:{ResolvedLanguage}:{InstanceType}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetPublicTourInstancesQueryHandler(ITourInstanceService tourInstanceService)
    : IQueryHandler<GetPublicTourInstancesQuery, ErrorOr<PaginatedList<TourInstanceVm>>>
{
    public async Task<ErrorOr<PaginatedList<TourInstanceVm>>> Handle(GetPublicTourInstancesQuery request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.GetPublicAvailable(
            request.Destination,
            request.SortBy,
            request.Page,
            request.PageSize,
            request.ResolvedLanguage,
            request.InstanceType);
    }
}

