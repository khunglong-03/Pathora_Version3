using Application.Common;
using Application.Contracts.Identity;
using Application.Services;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.Identity.Queries;

public sealed record GetTabsQuery(string CurrentUserId) : IQuery<ErrorOr<List<TabVm>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.User}:tabs:{CurrentUserId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetTabsQueryHandler(IIdentityService identityService)
    : IQueryHandler<GetTabsQuery, ErrorOr<List<TabVm>>>
{
    public async Task<ErrorOr<List<TabVm>>> Handle(GetTabsQuery request, CancellationToken cancellationToken)
    {
        return await identityService.GetTabs();
    }
}
