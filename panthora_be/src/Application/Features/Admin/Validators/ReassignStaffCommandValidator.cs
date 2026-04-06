namespace Application.Features.Admin.Validators;

using Application.Features.Admin.Commands.ReassignStaff;
using FluentValidation;

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