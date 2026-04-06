using Application.Contracts.Identity;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;
using FluentValidation;

namespace Application.Features.Identity.Commands;

public sealed record ResetPasswordCommand(ResetPasswordRequest Request) : ICommand<ErrorOr<Success>>;

public sealed class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.Request.Token)
            .NotEmpty();

        RuleFor(x => x.Request.NewPassword)
            .NotEmpty()
            .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$");
    }
}

public sealed class ResetPasswordCommandHandler(IIdentityService identityService)
    : ICommandHandler<ResetPasswordCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        return await identityService.ResetPassword(request.Request);
    }
}
