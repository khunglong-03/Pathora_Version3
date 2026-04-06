using BuildingBlocks.CORS;
using ErrorOr;
using Application.Contracts.Identity;
using Application.Services;

namespace Application.Features.Identity.Commands;

public sealed record LogoutCommand(string RefreshToken) : ICommand<ErrorOr<Success>>;

public sealed class LogoutCommandHandler(IIdentityService identityService)
    : ICommandHandler<LogoutCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        return await identityService.Logout(new LogoutRequest(request.RefreshToken));
    }
}



