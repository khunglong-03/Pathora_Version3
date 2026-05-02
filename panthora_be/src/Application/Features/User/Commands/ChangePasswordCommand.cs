using Application.Common;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.User.Commands;

public sealed record ChangePasswordCommand([property: JsonPropertyName("userId")] Guid UserId) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.User];
}

public sealed class ChangePasswordCommandHandler(IUserService userService)
    : ICommandHandler<ChangePasswordCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        return await userService.ChangePassword(new Contracts.User.ChangePasswordRequest(request.UserId));
    }
}
