namespace Application.Features.Admin.Commands.UpdateStaffUnderManager;

using FluentValidation;

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
