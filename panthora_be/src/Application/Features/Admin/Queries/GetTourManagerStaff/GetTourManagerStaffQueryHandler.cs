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
        ITourManagerAssignmentRepository assignmentRepository)
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
                staffList.Add(new StaffMemberDto(
                    staffUser.Id,
                    staffUser.FullName ?? staffUser.Username,
                    staffUser.Email,
                    staffUser.AvatarUrl,
                    roleName,
                    roleInTeam,
                    status));
            }
        }

        return new TourManagerStaffDto(
            new UserSummaryDto(manager.Id, manager.FullName ?? manager.Username, manager.Email, manager.AvatarUrl),
            staffList);
    }
}
