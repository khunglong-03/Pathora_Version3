using Application.Common.Constant;
using Application.Features.Public.Queries;
using FluentValidation;

namespace Application.Features.Public.Validators;

public sealed class SearchToursQueryValidator : AbstractValidator<SearchToursQuery>
{
    public SearchToursQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage(ValidationMessages.SearchToursPageMinimum1);

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50)
            .WithMessage(ValidationMessages.SearchToursPageSizeRange);

        RuleFor(x => x.People)
            .InclusiveBetween(1, 50)
            .When(x => x.People.HasValue)
            .WithMessage(ValidationMessages.SearchToursPeopleRange);

        RuleFor(x => x.MinPrice)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MinPrice.HasValue)
            .WithMessage(ValidationMessages.SearchToursMinPriceMinimum0);

        RuleFor(x => x.MaxPrice)
            .GreaterThanOrEqualTo(0)
            .When(x => x.MaxPrice.HasValue)
            .WithMessage(ValidationMessages.SearchToursMaxPriceMinimum0);

        RuleFor(x => x.MaxPrice)
            .GreaterThanOrEqualTo(x => x.MinPrice!.Value)
            .When(x => x.MinPrice.HasValue && x.MaxPrice.HasValue)
            .WithMessage(ValidationMessages.SearchToursMaxPriceGreaterThanOrEqualMinPrice);

        RuleFor(x => x.MinDays)
            .GreaterThanOrEqualTo(1)
            .When(x => x.MinDays.HasValue)
            .WithMessage(ValidationMessages.SearchToursMinDaysMinimum1);

        RuleFor(x => x.MaxDays)
            .GreaterThanOrEqualTo(1)
            .When(x => x.MaxDays.HasValue)
            .WithMessage(ValidationMessages.SearchToursMaxDaysMinimum1);

        RuleFor(x => x.MaxDays)
            .GreaterThanOrEqualTo(x => x.MinDays!.Value)
            .When(x => x.MinDays.HasValue && x.MaxDays.HasValue)
            .WithMessage(ValidationMessages.SearchToursMaxDaysGreaterThanOrEqualMinDays);
    }
}
