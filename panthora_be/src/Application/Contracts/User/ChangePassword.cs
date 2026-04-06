using Application.Common.Constant;
using FluentValidation;

namespace Application.Contracts.User;

public sealed record ChangePasswordRequest(Guid UserId, string? NewPassword = null);

public sealed class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.UserId).NotEmpty().WithMessage(ValidationMessages.UserIdRequired);
    }
}

