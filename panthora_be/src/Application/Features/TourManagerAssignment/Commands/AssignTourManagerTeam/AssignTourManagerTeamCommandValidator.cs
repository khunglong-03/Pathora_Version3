using Application.Common.Constant;
using Application.Contracts.TourManagerAssignment;
using Application.Features.TourManagerAssignment.Commands.AssignTourManagerTeam;
using FluentValidation;

namespace Application.Features.TourManagerAssignment.Commands.AssignTourManagerTeam;

public sealed class AssignTourManagerTeamCommandValidator : AbstractValidator<AssignTourManagerTeamCommand>
{
    public AssignTourManagerTeamCommandValidator()
    {
        RuleFor(x => x.TourManagerUserId)
            .NotEmpty().WithMessage(ValidationMessages.UserIdRequired);

        RuleForEach(x => x.Assignments)
            .SetValidator(new AssignmentItemValidator());
    }
}

public sealed class AssignmentItemValidator : AbstractValidator<AssignmentItem>
{
    public AssignmentItemValidator()
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
