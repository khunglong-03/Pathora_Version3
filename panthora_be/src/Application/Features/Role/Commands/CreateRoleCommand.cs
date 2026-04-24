using Application.Common;
using Application.Common.Constant;
using Application.Contracts.Role;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Features.Role.Commands;

public sealed record CreateRoleCommand(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("description")] string Description)
    : ICommand<ErrorOr<int>>;

public sealed class CreateRoleCommandValidator : AbstractValidator<CreateRoleCommand>
{
    public CreateRoleCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(ValidationMessages.RoleNameRequired)
            .MaximumLength(100).WithMessage(ValidationMessages.RoleNameMaxLength100);
    }
}

public sealed class CreateRoleCommandHandler(IRoleService roleService)
    : ICommandHandler<CreateRoleCommand, ErrorOr<int>>
{
    public async Task<ErrorOr<int>> Handle(CreateRoleCommand request, CancellationToken cancellationToken)
    {
        return await roleService.CreateAsync(new CreateRoleRequest(request.Name, request.Description));
    }
}
