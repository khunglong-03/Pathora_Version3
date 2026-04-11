namespace Application.Features.Admin.Commands.ReassignStaff;

using Application.Common.Constant;
using Application.Common.Interfaces;
using global::Contracts.ModelResponse;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using MediatR;
using Application.Common.Interfaces;
using System.Linq;

public sealed class ReassignStaffCommandHandler(
        ITourManagerAssignmentRepository assignmentRepository,
        ICurrentUser _currentUser)
    : IRequestHandler<ReassignStaffCommand, ErrorOr<Success>>
{
    public async Task<ErrorOr<Success>> Handle(
        ReassignStaffCommand request,
        CancellationToken cancellationToken)
    {
        if (request.ManagerId != _currentUser.Id)
            return Error.Forbidden(ErrorConstants.Authorization.Forbidden);

        // Idempotency: same manager = no-op
        if (request.ManagerId == request.TargetManagerId)
            return Result.Success;

        // Verify the staff member is assigned to the current manager
        var currentAssignments = await assignmentRepository.GetByManagerIdAsync(
            request.ManagerId, cancellationToken);

        var targetAssignment = currentAssignments
            .FirstOrDefault(a => a.AssignedUserId == request.StaffId
                && (a.AssignedEntityType == AssignedEntityType.TourDesigner || a.AssignedEntityType == AssignedEntityType.TourGuide));

        if (targetAssignment is null)
            return Error.NotFound("Admin.StaffNotAssigned", "Staff member is not assigned to the specified manager.");

        // Remove from old manager
        await assignmentRepository.RemoveByIdAsync(targetAssignment.Id, cancellationToken);

        // Create new assignment under target manager
        var newAssignment = TourManagerAssignmentEntity.Create(
            request.TargetManagerId,
            targetAssignment.AssignedEventType,
            request.StaffId,
            null,
            targetAssignment.AssignedRoleInTeam,
            _currentUser.Id.ToString());

        await assignmentRepository.AssignAsync(newAssignment, cancellationToken);

        return Result.Success;
    }
}