using Application.Common;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Role.Commands;
public sealed record DeleteRoleCommand([property: JsonPropertyName("roleId")] int RoleId)
    : ICommand<ErrorOr<Success>>;

public sealed class DeleteRoleCommandHandler(IRoleService roleService)
    : ICommandHandler<DeleteRoleCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteRoleCommand request, CancellationToken cancellationToken)
    {
        return await roleService.DeleteAsync(request.RoleId);
    }
}
