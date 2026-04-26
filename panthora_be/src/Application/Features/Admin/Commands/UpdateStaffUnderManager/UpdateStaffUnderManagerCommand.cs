using Application.Common.Constant;
using Application.Common.Interfaces;
using Application.Contracts.Admin;
using Application.Features.Admin.DTOs;
using BuildingBlocks.CORS;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.UnitOfWork;
using ErrorOr;
using FluentValidation;
using Microsoft.Extensions.Logging;
using System.Text.Json.Serialization;
using global::Contracts.Interfaces;

namespace Application.Features.Admin.Commands.UpdateStaffUnderManager;

public sealed record UpdateStaffUnderManagerCommand(
    [property: JsonPropertyName("managerId")] Guid ManagerId,
    [property: JsonPropertyName("staffId")] Guid StaffId,
    [property: JsonPropertyName("request")] UpdateStaffUnderManagerRequest Request) : ICommand<ErrorOr<StaffMemberDto>>;


public sealed class UpdateStaffUnderManagerCommandHandler(
    IUserRepository userRepository,
    IRoleRepository roleRepository,
    ITourManagerAssignmentRepository assignmentRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    ICurrentUser _currentUser,
    ILogger<UpdateStaffUnderManagerCommandHandler> logger)
    : ICommandHandler<UpdateStaffUnderManagerCommand, ErrorOr<StaffMemberDto>>
{
    public async Task<ErrorOr<StaffMemberDto>> Handle(
        UpdateStaffUnderManagerCommand command,
        CancellationToken cancellationToken)
    {
        // 1. Validate permissions
        bool isAdmin = false;
        if (_currentUser.Id.HasValue)
        {
            var rolesResult = await roleRepository.FindByUserId(_currentUser.Id.Value.ToString(), cancellationToken);
            if (!rolesResult.IsError && rolesResult.Value.Any(r => r.Name == "Admin"))
            {
                isAdmin = true;
            }
        }

        if (command.ManagerId != _currentUser.Id && !isAdmin)
        {
            logger.LogWarning("Manager {CurrentUserId} attempted to update staff {StaffId} under manager {ManagerId}", _currentUser.Id, command.StaffId, command.ManagerId);
            return Error.Forbidden(ErrorConstants.Authorization.UnauthorizedDescription);
        }

        // 2. Validate Manager
        var managerResult = await userRepository.FindById(command.ManagerId, cancellationToken);
        if (managerResult is null)
        {
            return Error.NotFound(ErrorConstants.User.NotFoundCode, "Manager not found.");
        }

        // 3. Validate Staff
        var staffResult = await userRepository.FindById(command.StaffId, cancellationToken);
        if (staffResult is null)
        {
            return Error.NotFound(ErrorConstants.User.NotFoundCode, "Staff not found.");
        }

        // 4. Verify Staff belongs to Manager
        var existingAssignments = await assignmentRepository.GetByManagerIdAsync(command.ManagerId, cancellationToken);
        var assignment = existingAssignments.FirstOrDefault(a => a.AssignedUserId == command.StaffId);

        if (assignment is null)
        {
            return Error.Validation("Assignment.Invalid", "Staff does not belong to this manager.");
        }

        // 5. Validate Email uniqueness if changed
        if (!string.Equals(staffResult.Email, command.Request.Email, StringComparison.OrdinalIgnoreCase))
        {
            var isUnique = await userRepository.IsEmailUnique(command.Request.Email, cancellationToken);
            if (!isUnique)
            {
                return Error.Conflict(ErrorConstants.User.DuplicateEmailCode, ErrorConstants.User.DuplicateEmailDescription);
            }
            staffResult.Email = command.Request.Email;
            staffResult.Username = command.Request.Email; // Keep username synced
        }

        // 6. Update Basic Info
        staffResult.FullName = command.Request.FullName;

        if (!string.IsNullOrEmpty(command.Request.Password))
        {
            staffResult.ChangePassword(passwordHasher.HashPassword(command.Request.Password), _currentUser.Id?.ToString() ?? "system", forcePasswordChange: false);
        }

        AssignedEntityType newEntityType = command.Request.StaffType switch
        {
            1 => AssignedEntityType.TourDesigner,
            2 => AssignedEntityType.TourGuide,
            _ => throw new InvalidOperationException($"Invalid StaffType: {command.Request.StaffType}")
        };

        string targetRoleName = command.Request.StaffType == 1 ? "TourDesigner" : "TourGuide";
        var targetRoleResult = await roleRepository.FindByNameAsync(targetRoleName);
        if (targetRoleResult.IsError || targetRoleResult.Value is null)
        {
            return Error.NotFound("Role.NotFound", $"Role '{targetRoleName}' not found in system.");
        }
        int newRoleId = targetRoleResult.Value.Id;

        await unitOfWork.ExecuteTransactionAsync(async () =>
        {
            userRepository.Update(staffResult);

            if (assignment.AssignedEntityType != newEntityType)
            {
                var assignRepo = unitOfWork.GenericRepository<TourManagerAssignmentEntity>();

                // Update assignment entity type
                assignment.AssignedEntityType = newEntityType;
                assignRepo.Update(assignment);

                // Switch true role in db
                await roleRepository.DeleteUser(staffResult.Id);
                await roleRepository.AddUser(staffResult.Id, [newRoleId]);
            }

        });

        // 7. Map to DTO
        var displayRoleName = command.Request.StaffType switch
        {
            1 => "Tour Designer",
            2 => "Tour Guide",
            _ => "Staff"
        };

        return new StaffMemberDto(
            staffResult.Id,
            staffResult.FullName ?? staffResult.Username,
            staffResult.Email,
            staffResult.AvatarUrl,
            displayRoleName,
            assignment.AssignedRoleInTeam?.ToString() ?? "Member",
            staffResult.Status.ToString(),
            []
        );
    }
}


public sealed class UpdateStaffUnderManagerCommandValidator : AbstractValidator<UpdateStaffUnderManagerCommand>
{
    public UpdateStaffUnderManagerCommandValidator()
    {
        RuleFor(x => x.ManagerId).NotEmpty();
        RuleFor(x => x.StaffId).NotEmpty();
        RuleFor(x => x.Request.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Request.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Request.StaffType).InclusiveBetween(1, 2);
    }
}
