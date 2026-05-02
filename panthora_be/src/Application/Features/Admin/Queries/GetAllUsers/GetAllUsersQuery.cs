using Application.Common.Constant;
using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using MediatR;
using System.Text.Json.Serialization;
using global::Contracts;

namespace Application.Features.Admin.Queries.GetAllUsers;

public sealed record GetAllUsersQuery(
    [property: JsonPropertyName("pageNumber")] int PageNumber = 1,
    [property: JsonPropertyName("pageSize")] int PageSize = 10,
    [property: JsonPropertyName("searchText")] string? SearchText = null,
    [property: JsonPropertyName("status")] UserStatus? Status = null,
    [property: JsonPropertyName("role")] string? Role = null) : IQuery<ErrorOr<PaginatedList<UserListItemDto>>>;

public sealed class GetAllUsersQueryHandler(
        IUserRepository userRepository,
        IRoleRepository roleRepository)
    : IRequestHandler<GetAllUsersQuery, ErrorOr<PaginatedList<UserListItemDto>>>
{
    public async Task<ErrorOr<PaginatedList<UserListItemDto>>> Handle(
        GetAllUsersQuery request,
        CancellationToken cancellationToken)
    {
        int? roleId = null;

        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            var roleResult = await roleRepository.FindByNameAsync(request.Role);
            if (roleResult.IsError || roleResult.Value == null)
            {
                var countsForInvalidRole = await userRepository.CountByRolesAsync(request.SearchText, cancellationToken);
                return new PaginatedList<UserListItemDto>(0, [], request.PageNumber, request.PageSize, countsForInvalidRole);
            }
            roleId = roleResult.Value.Id;
        }

        var users = await userRepository.FindAll(
            request.SearchText,
            roleId,
            request.PageNumber,
            request.PageSize);
        var roleCounts = await userRepository.CountByRolesAsync(request.SearchText, cancellationToken);

        var total = await userRepository.CountAll(request.SearchText, roleId);

        if (users.Count == 0)
            return new PaginatedList<UserListItemDto>(total, [], request.PageNumber, request.PageSize, roleCounts);

        var userIds = users.Select(u => u.Id).ToList();
        var rolesMapResult = await roleRepository.FindByUserIds(userIds);
        var rolesMap = rolesMapResult.IsError
            ? new Dictionary<Guid, List<RoleEntity>>()
            : rolesMapResult.Value;

        var items = users.Select(u =>
        {
            var roles = rolesMap.TryGetValue(u.Id, out var r)
                ? r.Select(x => x.Name).ToList()
                : new List<string>();
            var primaryRole = roles.Count > 0 ? roles[0] : null;
            return new UserListItemDto(
                u.Id, u.Username, u.FullName, u.Email, u.PhoneNumber,
                u.AvatarUrl, u.Status, u.VerifyStatus, roles, primaryRole);
        }).ToList();

        return new PaginatedList<UserListItemDto>(total, items, request.PageNumber, request.PageSize, roleCounts);
    }
}
