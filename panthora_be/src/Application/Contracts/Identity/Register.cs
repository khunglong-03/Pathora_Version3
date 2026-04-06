using Application.Common.Constant;
using FluentValidation;

namespace Application.Contracts.Identity;

public sealed record RegisterRequest(
    string Username,
    string FullName,
    string Email,
    string Password
);

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage(ValidationMessages.EmailRequired)
            .Matches(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
            .WithMessage(ValidationMessages.EmailInvalid);

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage(ValidationMessages.FullNameRequired);

        RuleFor(x => x.Username)
            .NotEmpty().WithMessage(ValidationMessages.UsernameRequired);
    }
}

