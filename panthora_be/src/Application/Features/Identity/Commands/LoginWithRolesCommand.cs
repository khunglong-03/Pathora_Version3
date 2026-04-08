using Application.Common.Constant;
using Application.Contracts.Identity;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;
using System.Text.RegularExpressions;

namespace Application.Features.Identity.Commands;

public sealed record LoginWithRolesCommand(string Email, string Password)
    : ICommand<ErrorOr<LoginResponse>>;

public sealed class LoginWithRolesCommandValidator : AbstractValidator<LoginWithRolesCommand>
{
    private static readonly Regex SqlInjectionPattern = new(
        "('\\s*or\\s+\\d+=\\d+|--|;|\\bunion\\b|\\bdrop\\b|\\binsert\\b|\\bdelete\\b|\\bupdate\\b)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public LoginWithRolesCommandValidator()
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

public sealed class LoginWithRolesCommandHandler(IIdentityService identityService)
    : ICommandHandler<LoginWithRolesCommand, ErrorOr<LoginResponse>>
{
    public async Task<ErrorOr<LoginResponse>> Handle(
        LoginWithRolesCommand request,
        CancellationToken cancellationToken)
    {
        var result = await identityService.LoginWithRoles(
            new LoginRequest(request.Email, request.Password),
            cancellationToken);

        if (result.IsError)
        {
            return result.Errors;
        }

        return result.Value.Response;
    }
}
