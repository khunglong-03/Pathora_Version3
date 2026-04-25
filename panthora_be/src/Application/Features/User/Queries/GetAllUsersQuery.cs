using Application.Common;
using Application.Contracts.User;
using Application.Services;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Contracts;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.User.Queries;
public sealed record GetAllUsersQuery(
    [property: JsonPropertyName("departmentId")] Guid DepartmentId,
    [property: JsonPropertyName("textSearch")] string? TextSearch,
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonPropertyName("roleName")] string? RoleName = null) : IQuery<ErrorOr<PaginatedListWithPermissions<UserVm>>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.User}:all:{DepartmentId}:{TextSearch}:{PageNumber}:{PageSize}:{RoleName}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(30);
}

public sealed class GetAllUsersQueryHandler(IUserService userService)
    : IQueryHandler<GetAllUsersQuery, ErrorOr<PaginatedListWithPermissions<UserVm>>>
{
    public async Task<ErrorOr<PaginatedListWithPermissions<UserVm>>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
    {
        return await userService.GetAll(new GetAllUserRequest(
            request.DepartmentId, request.TextSearch, request.PageNumber, request.PageSize)
        { RoleName = request.RoleName });
    }
}

