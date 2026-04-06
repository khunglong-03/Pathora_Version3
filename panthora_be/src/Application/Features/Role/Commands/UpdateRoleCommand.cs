using Application.Common;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;
using Application.Contracts.Role;
using Application.Services;

namespace Application.Features.Role.Commands;

public sealed record UpdateRoleCommand(int RoleId, string Name, string Description, RoleStatus Status, int Type, IEnumerable<int> FunctionIds) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Role, CacheKey.User];
}

public sealed class UpdateRoleCommandHandler(IRoleService roleService)
    : ICommandHandler<UpdateRoleCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateRoleCommand request, CancellationToken cancellationToken)
    {
        return await roleService.Update(new UpdateRoleRequest(
            request.RoleId, request.Name, request.Description, request.Status, request.Type, request.FunctionIds));
    }
}
