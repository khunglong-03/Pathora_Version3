namespace Application.Features.Role.Queries;

using FluentValidation;

public sealed class GetAllRolesQueryValidator : AbstractValidator<GetAllRolesQuery>
{
    public GetAllRolesQueryValidator()
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
