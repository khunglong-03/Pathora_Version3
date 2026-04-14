namespace Application.Features.Admin.Queries.GetTourManagerStaff;

using Application.Common.Constant;
using Application.Features.Admin.DTOs;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using MediatR;

public sealed class GetTourManagerStaffQueryHandler(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        ITourManagerAssignmentRepository assignmentRepository,
        ITourInstanceRepository tourInstanceRepository)
    : IRequestHandler<GetTourManagerStaffQuery, ErrorOr<TourManagerStaffDto>>
{
    public async Task<ErrorOr<TourManagerStaffDto>> Handle(
        GetTourManagerStaffQuery request,
        CancellationToken cancellationToken)
    {
        var manager = await userRepository.FindById(request.ManagerId);
        if (manager is null)
            return Error.NotFound(ErrorConstants.User.NotFoundCode, ErrorConstants.User.NotFoundDescription);

        var assignments = await assignmentRepository.GetByManagerIdAsync(request.ManagerId, cancellationToken);
        var assignedUserIds = assignments
            .Where(a => a.AssignedUserId.HasValue)
            .Select(a => a.AssignedUserId!.Value)
            .Distinct()
            .ToList();

        var usersResult = await userRepository.FindByIds(assignedUserIds);
        var userMap = usersResult.ToDictionary(u => u.Id);

        var rolesResult = await roleRepository.FindByUserIds(assignedUserIds.ToList());
        var roleMap = rolesResult.IsError
            ? new Dictionary<Guid, List<RoleEntity>>()
            : rolesResult.Value;

        // Build a map: userId -> list of active tour instances they manage
        var staffTourMap = await BuildStaffTourMapAsync(assignedUserIds, cancellationToken);

        var staffList = new List<StaffMemberDto>();
        foreach (var assignment in assignments)
        {
            if (assignment.AssignedUserId.HasValue && userMap.TryGetValue(assignment.AssignedUserId.Value, out var staffUser))
            {
                var roleName = assignment.AssignedEntityType switch
                {
                    AssignedEntityType.TourDesigner => "Tour Designer",
                    AssignedEntityType.TourGuide => "Tour Guide",
                    _ => "Staff"
                };
                var roleInTeam = assignment.AssignedRoleInTeam?.ToString() ?? "Member";
                var status = staffUser.IsDeleted ? "Khóa" : "Hoạt động";

                staffTourMap.TryGetValue(staffUser.Id, out var activeTours);

                staffList.Add(new StaffMemberDto(
                    staffUser.Id,
                    staffUser.FullName ?? staffUser.Username,
                    staffUser.Email,
                    staffUser.AvatarUrl,
                    roleName,
                    roleInTeam,
                    status,
                    activeTours ?? []));
            }
        }

        return new TourManagerStaffDto(
            new UserSummaryDto(manager.Id, manager.FullName ?? manager.Username, manager.Email, manager.AvatarUrl),
            staffList);
    }

    private async Task<Dictionary<Guid, List<StaffTourAssignmentDto>>> BuildStaffTourMapAsync(
        List<Guid> userIds,
        CancellationToken cancellationToken)
    {
        var result = new Dictionary<Guid, List<StaffTourAssignmentDto>>();
        if (userIds.Count == 0) return result;

        // Single batch query: get all active tour instances where any of these users is assigned
        var instances = await tourInstanceRepository.FindByManagerUserIds(userIds, cancellationToken);

        foreach (var instance in instances)
        {
            foreach (var manager in instance.Managers)
            {
                if (!userIds.Contains(manager.UserId)) continue;

                if (!result.ContainsKey(manager.UserId))
                    result[manager.UserId] = [];

                result[manager.UserId].Add(new StaffTourAssignmentDto(
                    instance.Id,
                    instance.TourName,
                    instance.TourInstanceCode,
                    instance.StartDate,
                    instance.EndDate,
                    instance.Status.ToString(),
                    manager.Role.ToString()));
            }
        }

        return result;
    }
}
