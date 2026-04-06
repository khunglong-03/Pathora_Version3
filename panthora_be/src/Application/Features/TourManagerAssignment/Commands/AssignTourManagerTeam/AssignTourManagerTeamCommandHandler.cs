using Application.Common.Constant;
using Application.Contracts.TourManagerAssignment;
using Application.Features.TourManagerAssignment.Commands.AssignTourManagerTeam;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;

namespace Application.Features.TourManagerAssignment.Commands.AssignTourManagerTeam;

public sealed class AssignTourManagerTeamCommandHandler(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        ITourManagerAssignmentRepository repository,
        ITourInstanceRepository tourInstanceRepository)
    : ICommandHandler<AssignTourManagerTeamCommand, ErrorOr<Success>>
{
    private readonly IUserRepository _userRepository = userRepository;
    private readonly IRoleRepository _roleRepository = roleRepository;
    private readonly ITourManagerAssignmentRepository _repository = repository;
    private readonly ITourInstanceRepository _tourInstanceRepository = tourInstanceRepository;

    public async Task<ErrorOr<Success>> Handle(
        AssignTourManagerTeamCommand request,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(request.TourManagerUserId, out var managerId))
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

        var managerRolesResult = await _roleRepository.FindByUserId(request.TourManagerUserId);
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

        var existingAssignments = await _repository.GetByManagerIdAsync(managerId, cancellationToken);
        var existingUserIds = existingAssignments
            .Where(a => a.AssignedUserId.HasValue)
            .Select(a => a.AssignedUserId!.Value)
            .ToHashSet();

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

            if (existingUserIds.Contains(uid))
            {
                return Error.Conflict(
                    code: "TourManagerAssignment.DuplicateUser",
                    description: $"User {uid} is already assigned to this manager's team.");
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

            var item = request.Assignments.First(a => a.AssignedUserId == uid);
            var entityType = (AssignedEntityType)item.AssignedEntityType;
            var validRole = entityType == AssignedEntityType.TourDesigner ? "TourDesigner" : "TourGuide";
            if (!roles.Contains(validRole))
            {
                return Error.Validation(
                    code: "TourManagerAssignment.InvalidRole",
                    description: $"User must have the {validRole} role to be assigned as a {entityType}.");
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

        foreach (var item in request.Assignments)
        {
            var assignment = TourManagerAssignmentEntity.Create(
                tourManagerId: managerId,
                entityType: (AssignedEntityType)item.AssignedEntityType,
                assignedUserId: item.AssignedUserId,
                assignedTourId: item.AssignedTourId,
                roleInTeam: item.AssignedRoleInTeam.HasValue ? (AssignedRoleInTeam)item.AssignedRoleInTeam.Value : null,
                performedBy: "system");

            await _repository.AssignAsync(assignment, cancellationToken);
        }

        return Result.Success;
    }
}
