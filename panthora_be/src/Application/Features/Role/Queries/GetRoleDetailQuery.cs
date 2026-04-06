using Application.Common;
using Application.Contracts.Role;
using Contracts.Interfaces;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.Role.Queries;

public sealed record GetRoleDetailQuery(int RoleId) : IQuery<ErrorOr<RoleDetailVm>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.Role}:detail:{RoleId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed class GetRoleDetailQueryHandler(IRoleService roleService)
    : IQueryHandler<GetRoleDetailQuery, ErrorOr<RoleDetailVm>>
{
    public async Task<ErrorOr<RoleDetailVm>> Handle(GetRoleDetailQuery request, CancellationToken cancellationToken)
    {
        return await roleService.GetDetail(new GetRoleDetailRequest(request.RoleId));
    }
}
