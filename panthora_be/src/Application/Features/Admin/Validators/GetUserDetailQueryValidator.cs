using Application.Features.Admin.Queries.GetUserDetail;
using FluentValidation;

namespace Application.Features.Admin.Validators;
public sealed class GetUserDetailQueryValidator : AbstractValidator<GetUserDetailQuery>
{
    public GetUserDetailQueryValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty();
    }
}
