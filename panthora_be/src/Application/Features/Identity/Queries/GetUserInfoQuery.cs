using Application.Common;
using Application.Contracts.Identity;
using Application.Services;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.Identity.Queries;

public sealed record GetUserInfoQuery(string CurrentUserId) : IQuery<ErrorOr<UserInfoVm>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.User}:info:{CurrentUserId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(10);
}

public sealed class GetUserInfoQueryHandler(IIdentityService identityService)
    : IQueryHandler<GetUserInfoQuery, ErrorOr<UserInfoVm>>
{
    public async Task<ErrorOr<UserInfoVm>> Handle(GetUserInfoQuery request, CancellationToken cancellationToken)
    {
        return await identityService.GetUserInfo();
    }
}
