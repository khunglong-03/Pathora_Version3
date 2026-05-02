using Application.Common.Constant;
using Domain.Enums;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Contracts.Role;

public sealed record UpdateRoleRequest(
    [property: JsonPropertyName("roleId")] int RoleId,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("status")] RoleStatus Status);

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
