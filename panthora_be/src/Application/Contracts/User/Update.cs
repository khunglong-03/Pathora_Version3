using Application.Common.Constant;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Contracts.User;

public sealed record UpdateUserRequest(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("departments")] List<UserDepartmentInfo> Departments,
    [property: JsonPropertyName("roleIds")] List<int> RoleIds,
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("avatar")] string Avatar
);

public sealed class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.FullName)
            .Length(1, 200).WithMessage(ValidationMessages.FullNameTooLong)
            .When(x => !string.IsNullOrEmpty(x.FullName));
    }
}

