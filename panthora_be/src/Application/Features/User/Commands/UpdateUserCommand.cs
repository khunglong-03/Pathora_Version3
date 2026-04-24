using Application.Common;
using Application.Contracts.User;
using Contracts.Interfaces;
using BuildingBlocks.CORS;
using ErrorOr;
using Application.Services;
using System.Text.Json.Serialization;

namespace Application.Features.User.Commands;

public sealed record UpdateUserCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("departments")] List<UserDepartmentInfo> Departments,
    [property: JsonPropertyName("roleIds")] List<int> RoleIds,
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("avatar")] string Avatar) : ICommand<ErrorOr<Success>>, ICacheInvalidator
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
