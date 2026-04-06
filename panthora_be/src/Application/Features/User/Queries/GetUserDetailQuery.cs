using Application.Common;
using Application.Contracts.User;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Services;

namespace Application.Features.User.Queries;

public sealed record GetUserDetailQuery(Guid Id) : IQuery<ErrorOr<UserDetailVm>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.User}:detail:{Id}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed class GetUserDetailQueryHandler(IUserService userService)
    : IQueryHandler<GetUserDetailQuery, ErrorOr<UserDetailVm>>
{
    public async Task<ErrorOr<UserDetailVm>> Handle(GetUserDetailQuery request, CancellationToken cancellationToken)
    {
        return await userService.GetDetail(request.Id);
    }
}

