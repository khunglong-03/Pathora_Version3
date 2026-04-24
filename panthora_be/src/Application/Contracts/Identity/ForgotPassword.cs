using Application.Common.Constant;
using FluentValidation;
using System.Text.Json.Serialization;

namespace Application.Contracts.Identity;

/// <summary>
/// Request to initiate password reset - user provides their email
/// </summary>
public record ForgotPasswordRequest(
    [property: JsonPropertyName("email")] string Email);

public class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage(ValidationMessages.EmailRequired)
            .EmailAddress().WithMessage(ValidationMessages.EmailInvalid);
    }
}

/// <summary>
/// Request to reset password using the token from email
/// </summary>
public record ResetPasswordRequest(
    [property: JsonPropertyName("token")] string Token,
    [property: JsonPropertyName("newPassword")] string NewPassword);

public class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.Token)
            .NotEmpty().WithMessage(ValidationMessages.CommonTokenRequired);

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage(ValidationMessages.NewPasswordRequired)
            .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$")
            .WithMessage(ValidationMessages.PasswordComplexity);
    }
}
