namespace Application.Features.Admin.Commands.CreateStaffUnderManager;

using FluentValidation;

public sealed class CreateStaffUnderManagerCommandValidator : AbstractValidator<CreateStaffUnderManagerCommand>
{
    public CreateStaffUnderManagerCommandValidator()
    {
        RuleFor(x => x.ManagerId)
            .NotEmpty();

        RuleFor(x => x.Request.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Request.FullName)
            .NotEmpty();

        RuleFor(x => x.Request.StaffType)
            .InclusiveBetween(1, 2)
            .WithMessage("StaffType must be 1 (TourDesigner) or 2 (TourGuide).");
    }
}
