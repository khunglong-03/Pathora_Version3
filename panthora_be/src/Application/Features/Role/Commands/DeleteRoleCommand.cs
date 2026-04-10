using Application.Common;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;

namespace Application.Features.Role.Commands;

public sealed record DeleteRoleCommand(int RoleId)
    : ICommand<ErrorOr<Success>>;

public sealed class DeleteRoleCommandHandler(IRoleService roleService)
    : ICommandHandler<DeleteRoleCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteRoleCommand request, CancellationToken cancellationToken)
    {
        return await roleService.DeleteAsync(request.RoleId);
    }
}
