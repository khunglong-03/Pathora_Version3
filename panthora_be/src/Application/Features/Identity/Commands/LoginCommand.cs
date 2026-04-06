using Application.Common.Constant;
using Application.Contracts.Identity;
using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;
using Application.Services;
using System.Text.RegularExpressions;

namespace Application.Features.Identity.Commands;

public sealed record LoginCommand(string Email, string Password) : ICommand<ErrorOr<LoginResponse>>;

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
        return await identityService.Login(new LoginRequest(request.Email, request.Password));
    }
}



