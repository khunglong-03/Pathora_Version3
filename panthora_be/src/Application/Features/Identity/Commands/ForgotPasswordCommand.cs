using Application.Contracts.Identity;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;

namespace Application.Features.Identity.Commands;

public sealed record ForgotPasswordCommand(ForgotPasswordRequest Request) : ICommand<ErrorOr<Success>>;

public sealed class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
    {
        RuleFor(x => x.Request.Email)
            .NotEmpty()
            .EmailAddress();
    }
}

public sealed class ForgotPasswordCommandHandler(IIdentityService identityService)
    : ICommandHandler<ForgotPasswordCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        return await identityService.ForgotPassword(request.Request);
    }
}
