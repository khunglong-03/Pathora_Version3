using Application.Common;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Services;

namespace Application.Features.User.Commands;

public sealed record DeleteUserCommand(Guid Id) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.User];
}

public sealed class DeleteUserCommandHandler(IUserService userService)
    : ICommandHandler<DeleteUserCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(DeleteUserCommand request, CancellationToken cancellationToken)
    {
        return await userService.Delete(request.Id);
    }
}
