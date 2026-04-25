using Application.Common.Constant;
using Application.Common;
using Application.Contracts.User;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.User.Commands;
public sealed record UpdateUserCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("departments")] List<UserDepartmentInfo> Departments,
    [property: JsonPropertyName("roleIds")] List<int> RoleIds,
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("avatar")] string Avatar) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate
    {
        get
        {
            var keys = new List<string> { CacheKey.User };
            if (RoleIds.Any(id => id is DefaultRoleIds.Admin or DefaultRoleIds.Manager))
            {
                keys.Add(CacheKey.TourManagerAssignment);
            }
            return keys;
        }
    }
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
