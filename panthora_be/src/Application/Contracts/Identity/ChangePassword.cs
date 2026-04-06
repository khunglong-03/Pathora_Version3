using Application.Common.Constant;
using Application.Features.Identity.Commands;
using FluentValidation;

namespace Application.Contracts.Identity;

public record ChangePasswordRequest(string OldPassword, string NewPassword);

public class ChangePasswordRequestValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage(ValidationMessages.NewPasswordRequired)
            .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$")
            .WithMessage(ValidationMessages.PasswordComplexity)
            .NotEqual(x => x.OldPassword)
            .WithMessage(ValidationMessages.NewPasswordMustDiffer);

        RuleFor(x => x.OldPassword)
            .NotEmpty().WithMessage(ValidationMessages.OldPasswordRequired);
    }
}

public class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage(ValidationMessages.NewPasswordRequired)
            .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$")
            .WithMessage(ValidationMessages.PasswordComplexity)
            .NotEqual(x => x.OldPassword)
            .WithMessage(ValidationMessages.NewPasswordMustDiffer);

        RuleFor(x => x.OldPassword)
            .NotEmpty().WithMessage(ValidationMessages.OldPasswordRequired);
    }
}

