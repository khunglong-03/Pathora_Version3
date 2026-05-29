using Application.Common;
using Application.Common.Constant;
using Application.Contracts.User;
using BuildingBlocks.CORS;
using Contracts;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace Application.Features.User.Queries.GetTeamGuides;

public sealed record GetTeamGuidesQuery() : IQuery<ErrorOr<List<UserVm>>>
{
}

public sealed class GetTeamGuidesQueryHandler(
    IUserRepository userRepository,
    IRoleRepository roleRepository,
    ITourManagerAssignmentRepository assignmentRepository,
    global::Contracts.Interfaces.IUser currentUser)
    : IQueryHandler<GetTeamGuidesQuery, ErrorOr<List<UserVm>>>
{
    public async Task<ErrorOr<List<UserVm>>> Handle(GetTeamGuidesQuery request, CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(currentUser.Id, out var userId))
            return Error.Unauthorized(description: "Invalid user ID");

        var isAdmin = currentUser.Roles?.Contains("Admin") ?? false;
        var isManager = currentUser.Roles?.Contains("Manager") ?? false;

        List<Guid> allowedGuideIds = new();

        if (isAdmin)
        {
            // Admin gets all TourGuides
            var roleResult = await roleRepository.FindByNameAsync("TourGuide");
            if (roleResult.IsError || roleResult.Value == null)
                return new List<UserVm>();

            var allUserRolesResult = await roleRepository.FindAllUserRoles();
            if (allUserRolesResult.IsError)
                return new List<UserVm>();

            allowedGuideIds = allUserRolesResult.Value
                .Where(ur => ur.RoleId == roleResult.Value.Id)
                .Select(ur => ur.UserId)
                .ToList();
        }
        else
        {
            // For Manager or TourOperator, find the team context
            Guid managerId = userId; // Default to self if Manager

            if (!isManager)
            {
                // Find who the current user's manager is
                // We need to scan all assignments (or a specific repo method)
                // For now, we fetch all assignments and find the one where this user is assigned
                // Alternatively, assignmentRepository.GetAllSummariesAsync might be cached and fast
                var allAssignments = await assignmentRepository.GetAllSummariesAsync(cancellationToken);
                var userAssignment = allAssignments.FirstOrDefault(a => a.AssignedUserId == userId);

                if (userAssignment is null)
                {
                    // User is not in any team, return empty
                    return new List<UserVm>();
                }
                managerId = userAssignment.TourManagerId;
            }

            // Get all assignments for this manager
            var teamAssignments = await assignmentRepository.GetByManagerIdAsync(managerId, cancellationToken);

            allowedGuideIds = teamAssignments
                .Where(a => a.AssignedEntityType == AssignedEntityType.TourGuide && a.AssignedUserId.HasValue)
                .Select(a => a.AssignedUserId!.Value)
                .Distinct()
                .ToList();
        }

        if (allowedGuideIds.Count == 0)
            return new List<UserVm>();

        // Fetch users
        var users = await userRepository.FindByIds(allowedGuideIds);

        // Fetch roles for mapping
        var rolesMapResult = await roleRepository.FindByUserIds(allowedGuideIds);
        var rolesMap = rolesMapResult.IsError ? new() : rolesMapResult.Value;

        var userVms = users.Select(u =>
        {
            var roles = rolesMap.TryGetValue(u.Id, out var r) ? r.Select(x => x.Name).ToList() : new List<string>();
            return new UserVm(
                Id: u.Id,
                Avatar: u.AvatarUrl,
                Username: u.Username,
                FullName: u.FullName,
                Email: u.Email,
                DepartmentName: string.Empty,
                Roles: roles,
                ButtonShow: new Dictionary<string, bool>()
            );
        }).ToList();

        return userVms;
    }
}
