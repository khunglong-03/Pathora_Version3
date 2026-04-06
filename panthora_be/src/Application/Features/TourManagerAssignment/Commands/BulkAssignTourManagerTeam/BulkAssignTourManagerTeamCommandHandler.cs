using Application.Common.Constant;
using Application.Contracts.TourManagerAssignment;
using Application.Features.TourManagerAssignment.Commands.BulkAssignTourManagerTeam;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;

namespace Application.Features.TourManagerAssignment.Commands.BulkAssignTourManagerTeam;

public sealed class BulkAssignTourManagerTeamCommandHandler(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        ITourManagerAssignmentRepository repository,
        ITourInstanceRepository tourInstanceRepository)
    : ICommandHandler<BulkAssignTourManagerTeamCommand, ErrorOr<Success>>
{
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IRoleRepository _roleRepository = roleRepository;
    private readonly ITourManagerAssignmentRepository _repository = repository;
    private readonly ITourInstanceRepository _tourInstanceRepository = tourInstanceRepository;

    public async Task<ErrorOr<Success>> Handle(
        BulkAssignTourManagerTeamCommand request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(request.ManagerId, out var managerId))
        {
            return Error.Validation(
                code: ErrorConstants.User.InvalidIdCode,
                description: ErrorConstants.User.InvalidIdDescription);
        }

        var manager = await _userRepository.FindById(managerId);
        if (manager == null)
        {
            return Error.NotFound(
                code: "TourManager.NotFound",
                description: "Tour manager not found.");
        }

        var managerRolesResult = await _roleRepository.FindByUserId(request.ManagerId);
        if (managerRolesResult.IsError)
            return managerRolesResult.Errors;
        var managerRoleNames = managerRolesResult.Value.Select(r => r.Name).ToList();
        if (!managerRoleNames.Contains("Manager"))
        {
            return Error.Validation(
                code: "TourManager.InvalidRole",
                description: "The specified user is not a Manager.");
        }

        if (request.Assignments.Count == 0)
        {
            return Error.Validation(
                code: "TourManagerAssignment.EmptyAssignments",
                description: "At least one assignment is required.");
        }

        var userIds = request.Assignments
            .Where(a => a.AssignedUserId.HasValue)
            .Select(a => a.AssignedUserId!.Value)
            .Distinct()
            .ToList();

        foreach (var uid in userIds)
        {
            var assignedUser = await _userRepository.FindById(uid);
            if (assignedUser == null)
            {
                return Error.NotFound(
                    code: "User.NotFound",
                    description: $"User with ID {uid} not found.");
            }

            if (uid == managerId)
            {
                return Error.Validation(
                    code: "TourManagerAssignment.SelfAssignment",
                    description: "Cannot assign the manager to their own team.");
            }

            var rolesResult = await _roleRepository.FindByUserId(uid.ToString());
            if (rolesResult.IsError)
                return rolesResult.Errors;
            var roles = rolesResult.Value.Select(r => r.Name).ToList();
            if (roles.Contains("Manager"))
            {
                return Error.Validation(
                    code: "TourManagerAssignment.ManagerCannotBeAssigned",
                    description: "A user with the Manager role cannot be assigned to a tour manager team.");
            }
        }

        var tourIds = request.Assignments
            .Where(a => a.AssignedTourId.HasValue)
            .Select(a => a.AssignedTourId!.Value)
            .Distinct()
            .ToList();

        foreach (var tid in tourIds)
        {
            var tour = await _tourInstanceRepository.FindById(tid, asNoTracking: true);
            if (tour == null)
            {
                return Error.NotFound(
                    code: ErrorConstants.Tour.NotFoundCode,
                    description: ErrorConstants.Tour.NotFoundDescription);
            }
        }

        var assignments = request.Assignments.Select(item =>
            TourManagerAssignmentEntity.Create(
                tourManagerId: managerId,
                entityType: (AssignedEntityType)item.AssignedEntityType,
                assignedUserId: item.AssignedUserId,
                assignedTourId: item.AssignedTourId,
                roleInTeam: item.AssignedRoleInTeam.HasValue ? (AssignedRoleInTeam)item.AssignedRoleInTeam.Value : null,
                performedBy: "system")).ToList();

        await _repository.BulkUpsertAsync(managerId, assignments, "system", cancellationToken);

        return Result.Success;
    }
}
