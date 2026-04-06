using Application.Common;
using Contracts;
using Contracts.Interfaces;
using Application.Contracts.Role;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.Role.Queries;

public sealed record GetAllRolesQuery()
    : IQuery<ErrorOr<PaginatedListWithPermissions<RoleVm>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.Role}:all";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed class GetAllRolesQueryHandler(IRoleService roleService)
    : IQueryHandler<GetAllRolesQuery, ErrorOr<PaginatedListWithPermissions<RoleVm>>>
{
    public async Task<ErrorOr<PaginatedListWithPermissions<RoleVm>>> Handle(GetAllRolesQuery request, CancellationToken cancellationToken)
    {
        return await roleService.GetAll(new GetAllRoleRequest());
    }
}


