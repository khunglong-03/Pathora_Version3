using Application.Contracts.Role;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Role.Queries;

public sealed record GetRoleDetailQuery([property: JsonPropertyName("roleId")] int RoleId)
    : IQuery<ErrorOr<RoleDetailResponse?>>;

public sealed class GetRoleDetailQueryHandler(IRoleService roleService)
    : IQueryHandler<GetRoleDetailQuery, ErrorOr<RoleDetailResponse?>>
{
    public async Task<ErrorOr<RoleDetailResponse?>> Handle(GetRoleDetailQuery request, CancellationToken cancellationToken)
    {
        return await roleService.GetByIdAsync(request.RoleId);
    }
}
