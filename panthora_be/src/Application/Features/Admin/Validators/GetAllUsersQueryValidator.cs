using Application.Features.Admin.Queries.GetAllUsers;
using FluentValidation;

namespace Application.Features.Admin.Validators;

public sealed class GetAllUsersQueryValidator : AbstractValidator<GetAllUsersQuery>
{
    public GetAllUsersQueryValidator()
    {
        RuleFor(x => x.PageNumber)
            .GreaterThan(0);

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100);

        RuleFor(x => x.SearchText)
            .MaximumLength(200)
            .When(x => !string.IsNullOrWhiteSpace(x.SearchText));
    }
}