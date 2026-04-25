using Application.Common.Constant;
using Application.Contracts.Identity;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

namespace Application.Features.Identity.Commands;
public sealed record LoginCommand(
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("password")] string Password) : ICommand<ErrorOr<LoginResponse>>;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    private static readonly Regex SqlInjectionPattern = new(
        "('\\s*or\\s+\\d+=\\d+|--|;|\\bunion\\b|\\bdrop\\b|\\binsert\\b|\\bdelete\\b|\\bupdate\\b)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage(ValidationMessages.EmailRequired)
            .EmailAddress().WithMessage(ValidationMessages.EmailInvalid);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage(ValidationMessages.PasswordRequired)
            .Must(password => !SqlInjectionPattern.IsMatch(password))
            .WithMessage(ValidationMessages.PasswordSqlInjectionDetected);
    }
}

public sealed class LoginCommandHandler(IIdentityService identityService)
    : ICommandHandler<LoginCommand, ErrorOr<LoginResponse>>
{
    public async Task<ErrorOr<LoginResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var result = await identityService.LoginWithRoles(new LoginRequest(request.Email, request.Password), cancellationToken);
        if (result.IsError)
        {
            return result.Errors;
        }
        return result.Value.Response;
    }
}



