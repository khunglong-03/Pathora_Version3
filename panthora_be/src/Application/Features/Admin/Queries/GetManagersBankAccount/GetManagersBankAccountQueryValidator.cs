using FluentValidation;

namespace Application.Features.Admin.Queries.GetManagersBankAccount;

public sealed class GetManagersBankAccountQueryValidator : AbstractValidator<GetManagersBankAccountQuery>
{
    public GetManagersBankAccountQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Page must be at least 1.");

        RuleFor(x => x.Limit)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Limit must be at least 1.")
            .LessThanOrEqualTo(100)
            .WithMessage("Limit cannot exceed 100.");
    }
}
