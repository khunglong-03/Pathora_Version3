using Application.Common.Constant;
using Application.Common;
using Application.Contracts.Role;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.Role.Commands;
public sealed record UpdateRoleCommand(
    [property: JsonPropertyName("roleId")] int RoleId,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("status")] RoleStatus Status)
    : ICommand<ErrorOr<Success>>;

public sealed class UpdateRoleCommandValidator : AbstractValidator<UpdateRoleCommand>
{
    public UpdateRoleCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(ValidationMessages.RoleNameRequired)
            .MaximumLength(100).WithMessage(ValidationMessages.RoleNameMaxLength100);
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage(ValidationMessages.RoleStatusInvalid);
    }
}

public sealed class UpdateRoleCommandHandler(IRoleService roleService)
    : ICommandHandler<UpdateRoleCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateRoleCommand request, CancellationToken cancellationToken)
    {
        return await roleService.UpdateAsync(new UpdateRoleRequest(
            request.RoleId, request.Name, request.Description, request.Status));
    }
}
