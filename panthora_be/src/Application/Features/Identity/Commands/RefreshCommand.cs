using Application.Contracts.Identity;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Services;

namespace Application.Features.Identity.Commands;

public sealed record RefreshCommand(string RefreshToken) : ICommand<ErrorOr<RefreshTokenResponse>>;

public sealed class RefreshCommandHandler(IIdentityService identityService)
    : ICommandHandler<RefreshCommand, ErrorOr<RefreshTokenResponse>>
{
    public async Task<ErrorOr<RefreshTokenResponse>> Handle(RefreshCommand request, CancellationToken cancellationToken)
    {
        return await identityService.Refresh(new RefreshTokenRequest(request.RefreshToken));
    }
}



