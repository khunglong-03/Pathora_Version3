using Application.Common.Constant;
using Application.Common.Interfaces;
using Application.Features.Admin.Commands.ReassignStaff;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using MediatR;
using System.Linq;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;
using global::Contracts.ModelResponse;

namespace Application.Features.Admin.Commands.ReassignStaff;

public sealed record ReassignStaffCommand(
    [property: JsonPropertyName("managerId")] Guid ManagerId,
    [property: JsonPropertyName("staffId")] Guid StaffId,
    [property: JsonPropertyName("targetManagerId")] Guid TargetManagerId) : ICommand<ErrorOr<Success>>;

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
            return Error.Forbidden(ErrorConstants.Authorization.UnauthorizedDescription);

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
            targetAssignment.AssignedEntityType,
            request.StaffId,
            null,
            targetAssignment.AssignedRoleInTeam,
            _currentUser.Id is not null ? _currentUser.Id.ToString()! : "system");

        await assignmentRepository.AssignAsync(newAssignment, cancellationToken);

        return Result.Success;
    }
}

public sealed class ReassignStaffCommandValidator : AbstractValidator<ReassignStaffCommand>
{
    public ReassignStaffCommandValidator()
    {
        RuleFor(x => x.ManagerId)
            .NotEmpty();

        RuleFor(x => x.StaffId)
            .NotEmpty();

        RuleFor(x => x.TargetManagerId)
            .NotEmpty();
    }
}