using Application.Common.Constant;
using FluentValidation;

namespace Application.Contracts.User;

public sealed record CreateUserRequest(
    List<UserDepartmentInfo> Departments,
    List<int> RoleIds,
    string Email,
    string FullName,
    string Avatar
);

public sealed record UserDepartmentInfo(
    Guid DepartmentId,
    Guid PositionId
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

