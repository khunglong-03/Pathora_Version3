using Application.Common.Constant;
using Application.Contracts.TourManagerAssignment;
using Application.Features.TourManagerAssignment.Commands.BulkAssignTourManagerTeam;
using FluentValidation;

namespace Application.Features.TourManagerAssignment.Commands.BulkAssignTourManagerTeam;

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
