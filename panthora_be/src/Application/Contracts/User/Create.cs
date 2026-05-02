using Application.Common.Constant;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Contracts.User;

public sealed record CreateUserRequest(
    [property: JsonPropertyName("departments")] List<UserDepartmentInfo> Departments,
    [property: JsonPropertyName("roleIds")] List<int> RoleIds,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("avatar")] string Avatar,
    [property: JsonPropertyName("password")] string? Password = null
);

public sealed record UserDepartmentInfo(
    [property: JsonPropertyName("departmentId")] Guid DepartmentId,
    [property: JsonPropertyName("positionId")] Guid PositionId
);

public sealed class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.Email)
            .Matches(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
            .WithMessage(ValidationMessages.EmailInvalid)
            .When(x => !string.IsNullOrEmpty(x.Email));
    }
}

