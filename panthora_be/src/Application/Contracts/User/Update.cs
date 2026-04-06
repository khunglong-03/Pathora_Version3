using Application.Common.Constant;
using FluentValidation;

namespace Application.Contracts.User;

public sealed record UpdateUserRequest(
    Guid Id,
    List<UserDepartmentInfo> Departments,
    List<int> RoleIds,
    string FullName,
    string Avatar
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

