using Application.Common.Constant;
using Domain.Enums;
using FluentValidation;

namespace Application.Contracts.Role;

public sealed record UpdateRoleRequest(
    int RoleId,
    string Name,
    string Description,
    RoleStatus Status,
    int Type,
    IEnumerable<int> FunctionIds);

public sealed class UpdateRoleRequestValidator : AbstractValidator<UpdateRoleRequest>
{
    public UpdateRoleRequestValidator()
    {
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage(ValidationMessages.RoleStatusInvalid);

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(ValidationMessages.RoleNameRequired)
            .MaximumLength(100).WithMessage(ValidationMessages.RoleNameMaxLength100);

        RuleFor(x => x.Description)
            .MaximumLength(250).WithMessage(ValidationMessages.DescriptionMaxLength250);
    }
}
