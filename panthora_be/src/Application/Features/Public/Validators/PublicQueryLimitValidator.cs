using Application.Common.Constant;
using Application.Features.Public.Queries;
using FluentValidation;

namespace Application.Features.Public.Validators;

public sealed class GetTopReviewsQueryValidator : AbstractValidator<GetTopReviewsQuery>
{
    public GetTopReviewsQueryValidator()
    {
        RuleFor(x => x.Limit)
            .InclusiveBetween(1, 50)
            .WithMessage(ValidationMessages.PublicQueryLimitRange1To50);
    }
}

public sealed class GetFeaturedToursQueryValidator : AbstractValidator<GetFeaturedToursQuery>
{
    public GetFeaturedToursQueryValidator()
    {
        RuleFor(x => x.Limit)
            .InclusiveBetween(1, 50)
            .WithMessage(ValidationMessages.PublicQueryLimitRange1To50);
    }
}

public sealed class GetLatestToursQueryValidator : AbstractValidator<GetLatestToursQuery>
{
    public GetLatestToursQueryValidator()
    {
        RuleFor(x => x.Limit)
            .InclusiveBetween(1, 50)
            .WithMessage(ValidationMessages.PublicQueryLimitRange1To50);
    }
}

public sealed class GetTopAttractionsQueryValidator : AbstractValidator<GetTopAttractionsQuery>
{
    public GetTopAttractionsQueryValidator()
    {
        RuleFor(x => x.Limit)
            .InclusiveBetween(1, 50)
            .WithMessage(ValidationMessages.PublicQueryLimitRange1To50);
    }
}

public sealed class GetTrendingDestinationsQueryValidator : AbstractValidator<GetTrendingDestinationsQuery>
{
    public GetTrendingDestinationsQueryValidator()
    {
        RuleFor(x => x.Limit)
            .InclusiveBetween(1, 50)
            .WithMessage(ValidationMessages.PublicQueryLimitRange1To50);
    }
}
