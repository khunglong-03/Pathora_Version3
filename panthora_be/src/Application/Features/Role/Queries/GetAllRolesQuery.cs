using Application.Contracts.Role;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Contracts;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Role.Queries;

public sealed record GetAllRolesQuery(
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonPropertyName("searchText")] string? SearchText = null)
    : IQuery<ErrorOr<PaginatedListWithPermissions<RoleVm>>>;

public sealed class GetAllRolesQueryHandler(IRoleService roleService)
    : IQueryHandler<GetAllRolesQuery, ErrorOr<PaginatedListWithPermissions<RoleVm>>>
{
    public async Task<ErrorOr<PaginatedListWithPermissions<RoleVm>>> Handle(GetAllRolesQuery request, CancellationToken cancellationToken)
    {
        return await roleService.GetAllAsync(new GetAllRoleRequest(request.PageNumber, request.PageSize, request.SearchText));
    }
}
