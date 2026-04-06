using Application.Common;
using Application.Contracts.User;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Services;

namespace Application.Features.User.Commands;

public sealed record UpdateUserCommand(
    Guid Id,
    List<UserDepartmentInfo> Departments,
    List<int> RoleIds,
    string FullName,
    string Avatar) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.User];
}

public sealed class UpdateUserCommandHandler(IUserService userService)
    : ICommandHandler<UpdateUserCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        return await userService.Update(new UpdateUserRequest(
            request.Id, request.Departments, request.RoleIds, request.FullName, request.Avatar));
    }
}
