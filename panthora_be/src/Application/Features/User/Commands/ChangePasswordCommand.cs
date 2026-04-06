using Application.Common;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Services;

namespace Application.Features.User.Commands;

public sealed record ChangePasswordCommand(Guid UserId) : ICommand<ErrorOr<Success>>, ICacheInvalidator
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
