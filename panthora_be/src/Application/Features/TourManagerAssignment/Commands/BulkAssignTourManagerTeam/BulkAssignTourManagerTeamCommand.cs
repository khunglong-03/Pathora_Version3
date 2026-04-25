namespace Application.Features.TourManagerAssignment.Commands.BulkAssignTourManagerTeam;

using Application.Common.Constant;
using Application.Common;
using Application.Contracts.TourManagerAssignment;
using Application.Features.TourManagerAssignment.Commands.BulkAssignTourManagerTeam;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using ErrorOr;
using FluentValidation;
using System.Text.Json.Serialization;



public sealed record BulkAssignTourManagerTeamCommand(
    [property: JsonPropertyName("managerId")] string ManagerId,
    [property: JsonPropertyName("assignments")] List<AssignmentItem> Assignments) : ICommand<ErrorOr<Success>>, ICacheInvalidator
{
    public IReadOnlyList<string> CacheKeysToInvalidate => [CacheKey.TourManagerAssignment];
}


public sealed class BulkAssignTourManagerTeamCommandHandler(
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        ITourManagerAssignmentRepository repository,
        ITourInstanceRepository tourInstanceRepository,
        global::Contracts.Interfaces.IUser user)
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
        var performedBy = user.Id ?? "system";

        if (!Guid.TryParse(request.ManagerId, out var managerId))
        {
            return Error.Validation(
                code: ErrorConstants.User.InvalidIdCode,
                description: ErrorConstants.User.InvalidIdDescription);
        }

        var manager = await _userRepository.FindById(managerId, cancellationToken);
        if (manager == null)
        {
            return Error.NotFound(
                code: "TourManager.NotFound",
                description: "Tour manager not found.");
        }

        var managerRolesResult = await _roleRepository.FindByUserId(request.ManagerId, cancellationToken);
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

        if (userIds.Contains(managerId))
        {
            return Error.Validation(
                code: "TourManagerAssignment.SelfAssignment",
                description: "Cannot assign the manager to their own team.");
        }

        if (userIds.Count > 0)
        {
            var usersResult = await _userRepository.FindByIds(userIds, cancellationToken);
            var foundIds = usersResult.Select(u => u.Id).ToHashSet();
            var missingId = userIds.FirstOrDefault(id => !foundIds.Contains(id));
            if (missingId != Guid.Empty)
            {
                return Error.NotFound(
                    code: "User.NotFound",
                    description: $"User with ID {missingId} not found.");
            }

            var rolesResult = await _roleRepository.FindByUserIds(userIds, cancellationToken);
            if (rolesResult.IsError)
                return rolesResult.Errors;
            var managerUsers = rolesResult.Value
                .Where(kvp => kvp.Value.Any(r => r.Name == "Manager"))
                .Select(kvp => kvp.Key)
                .ToList();
            if (managerUsers.Count > 0)
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

        if (tourIds.Count > 0)
        {
            var tours = await _tourInstanceRepository.FindByIds(tourIds, cancellationToken);
            var foundTourIds = tours.Select(t => t.Id).ToHashSet();
            var missingTourId = tourIds.FirstOrDefault(id => !foundTourIds.Contains(id));
            if (missingTourId != Guid.Empty)
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
                performedBy: performedBy)).ToList();

        await _repository.BulkUpsertAsync(managerId, assignments, performedBy, cancellationToken);

        return Result.Success;
    }
}


public sealed class BulkAssignTourManagerTeamCommandValidator : AbstractValidator<BulkAssignTourManagerTeamCommand>
{
    public BulkAssignTourManagerTeamCommandValidator()
    {
        RuleFor(x => x.ManagerId)
            .NotEmpty().WithMessage(ValidationMessages.UserIdRequired);

        RuleFor(x => x.Assignments)
            .NotEmpty()
            .WithMessage("At least one assignment is required.");

        RuleForEach(x => x.Assignments)
            .SetValidator(new BulkAssignmentItemValidator());
    }
}

public sealed class BulkAssignmentItemValidator : AbstractValidator<AssignmentItem>
{
    public BulkAssignmentItemValidator()
    {
        RuleFor(x => x.AssignedEntityType)
            .InclusiveBetween(1, 3)
            .WithMessage("Entity type must be 1 (TourDesigner), 2 (TourGuide), or 3 (Tour).");

        RuleFor(x => x.AssignedRoleInTeam)
            .InclusiveBetween(1, 2)
            .When(x => x.AssignedRoleInTeam.HasValue)
            .WithMessage("Role in team must be 1 (Lead) or 2 (Member).");

        RuleFor(x => x)
            .Must(x => x.AssignedEntityType != 3 || x.AssignedTourId.HasValue)
            .WithMessage("Tour ID is required when assigning a Tour entity.");

        RuleFor(x => x)
            .Must(x => x.AssignedEntityType == 3 || x.AssignedUserId.HasValue)
            .WithMessage("User ID is required when assigning a TourDesigner or TourGuide.");
    }
}
