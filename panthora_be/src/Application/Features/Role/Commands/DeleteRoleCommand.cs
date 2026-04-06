using Application.Common;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Contracts.Role;
using Application.Services;

namespace Application.Features.Role.Commands;

public sealed record DeleteRoleCommand(int RoleId) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Role, CacheKey.User];
}

public sealed class DeleteRoleCommandHandler(IRoleService roleService)
    : ICommandHandler<DeleteRoleCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteRoleCommand request, CancellationToken cancellationToken)
    {
        return await roleService.Delete(new DeleteRoleRequest(request.RoleId));
    }
}
