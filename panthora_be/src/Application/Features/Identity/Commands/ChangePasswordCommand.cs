using Application.Common;
using Application.Contracts.Identity;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;

namespace Application.Features.Identity.Commands;

public sealed record ChangePasswordCommand(string OldPassword, string NewPassword)
    : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.User];
}

public sealed class ChangePasswordCommandHandler(IIdentityService identityService)
    : ICommandHandler<ChangePasswordCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        return await identityService.ChangePassword(new ChangePasswordRequest(request.OldPassword, request.NewPassword));
    }
}
