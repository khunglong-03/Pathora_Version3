using Application.Common;
using Application.Common.Localization;
using Contracts;
using Contracts.Interfaces;
using Application.Dtos;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Services;

namespace Application.Features.Public.Queries;

public sealed record GetPublicTourInstancesQuery(
    string? Destination = null,
    string? SortBy = null,
    int Page = 1,
    int PageSize = 10,
    string? Language = null) : IQuery<ErrorOr<PaginatedList<TourInstanceVm>>>, ICacheable
{
    public string ResolvedLanguage => PublicLanguageResolver.Resolve(Language);

    public string CacheKey => $"{Common.CacheKey.TourInstance}:public:list:{Destination}:{SortBy}:{Page}:{PageSize}:{ResolvedLanguage}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetPublicTourInstancesQueryHandler(ITourInstanceService tourInstanceService)
    : IQueryHandler<GetPublicTourInstancesQuery, ErrorOr<PaginatedList<TourInstanceVm>>>
{
    public async Task<ErrorOr<PaginatedList<TourInstanceVm>>> Handle(GetPublicTourInstancesQuery request, CancellationToken cancellationToken)
    {
        return await tourInstanceService.GetPublicAvailable(request.Destination, request.SortBy, request.Page, request.PageSize, request.ResolvedLanguage);
    }
}

