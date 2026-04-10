using Application.Common.Constant;
using Domain.Enums;
using FluentValidation;

namespace Application.Contracts.Role;

public sealed record UpdateRoleRequest(
    int RoleId,
    string Name,
    string Description,
    RoleStatus Status);

public sealed class UpdateRoleRequestValidator : AbstractValidator<UpdateRoleRequest>
{
    public UpdateRoleRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(ValidationMessages.RoleNameRequired)
            .MaximumLength(100).WithMessage(ValidationMessages.RoleNameMaxLength100);
        RuleFor(x => x.Status)
            .IsInEnum().WithMessage(ValidationMessages.RoleStatusInvalid);
    }
}
