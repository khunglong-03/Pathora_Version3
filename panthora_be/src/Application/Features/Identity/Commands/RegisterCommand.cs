using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;
using Application.Common.Constant;
using Application.Contracts.Identity;
using Application.Services;

namespace Application.Features.Identity.Commands;

public sealed record RegisterCommand(string Username, string FullName, string Email, string Password) : ICommand<ErrorOr<Success>>;

public sealed class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage(ValidationMessages.EmailRequired)
            .Matches(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
            .WithMessage(ValidationMessages.EmailInvalid);

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage(ValidationMessages.FullNameRequired);

        RuleFor(x => x.Username)
            .NotEmpty().WithMessage(ValidationMessages.UsernameRequired);

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage(ValidationMessages.PasswordRequired)
            .MinimumLength(6).WithMessage(ValidationMessages.PasswordMinLength6);
    }
}

public sealed class RegisterCommandHandler(IIdentityService identityService)
    : ICommandHandler<RegisterCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        return await identityService.Register(new RegisterRequest(request.Username, request.FullName, request.Email, request.Password));
    }
}



