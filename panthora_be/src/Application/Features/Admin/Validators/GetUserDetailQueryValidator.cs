namespace Application.Features.Admin.Validators;

using Application.Features.Admin.Queries.GetUserDetail;
using FluentValidation;

public sealed class GetUserDetailQueryValidator : AbstractValidator<GetUserDetailQuery>
{
    public GetUserDetailQueryValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty();
    }
}
