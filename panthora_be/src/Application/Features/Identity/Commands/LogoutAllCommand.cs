using Application.Contracts.Identity;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;

namespace Application.Features.Identity.Commands;

public sealed record LogoutAllCommand : ICommand<ErrorOr<Success>>;

public sealed class LogoutAllCommandHandler(IIdentityService identityService)
    : ICommandHandler<LogoutAllCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(LogoutAllCommand request, CancellationToken cancellationToken)
    {
        return await identityService.LogoutAll();
    }
}
