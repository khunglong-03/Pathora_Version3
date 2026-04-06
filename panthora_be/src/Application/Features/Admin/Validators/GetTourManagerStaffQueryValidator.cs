namespace Application.Features.Admin.Validators;

using Application.Features.Admin.Queries.GetTourManagerStaff;
using FluentValidation;

public sealed class GetTourManagerStaffQueryValidator : AbstractValidator<GetTourManagerStaffQuery>
{
    public GetTourManagerStaffQueryValidator()
    {
        RuleFor(x => x.ManagerId)
            .NotEmpty();
    }
}