using Application.Contracts.Identity;
using Application.Services;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Identity.Commands;
public sealed record RefreshCommand([property: JsonPropertyName("refreshToken")] string RefreshToken) : ICommand<ErrorOr<RefreshTokenResponse>>;

public sealed class RefreshCommandHandler(IIdentityService identityService)
    : ICommandHandler<RefreshCommand, ErrorOr<RefreshTokenResponse>>
{
    public async Task<ErrorOr<RefreshTokenResponse>> Handle(RefreshCommand request, CancellationToken cancellationToken)
    {
        return await identityService.Refresh(new RefreshTokenRequest(request.RefreshToken));
    }
}



