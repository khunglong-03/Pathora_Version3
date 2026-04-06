using Application.Common;
using Application.Common.Constant;
using Contracts.Interfaces;
using Application.Contracts.Role;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;

namespace Application.Features.Role.Commands;

public sealed record CreateRoleCommand(string Name, string Description, int Type, IEnumerable<int>? FunctionIds = null) : ICommand<ErrorOr<int>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.Role, CacheKey.User];
}

public sealed class CreateRoleCommandValidator : AbstractValidator<CreateRoleCommand>
{
    public CreateRoleCommandValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(ValidationMessages.RoleNameRequired)
            .MaximumLength(100).WithMessage(ValidationMessages.RoleNameMaxLength100);

        RuleFor(x => x.Description)
            .MaximumLength(250).WithMessage(ValidationMessages.DescriptionMaxLength250);
    }
}

public sealed class CreateRoleCommandHandler(IRoleService roleService)
    : ICommandHandler<CreateRoleCommand, ErrorOr<int>>
{
    public async Task<ErrorOr<int>> Handle(CreateRoleCommand request, CancellationToken cancellationToken)
    {
        return await roleService.Create(new CreateRoleRequest(request.Name, request.Description, request.Type, request.FunctionIds ?? []));
    }
}
