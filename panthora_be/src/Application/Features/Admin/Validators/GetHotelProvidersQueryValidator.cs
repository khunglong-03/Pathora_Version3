namespace Application.Features.Admin.Validators;

using Application.Features.Admin.Queries.GetHotelProviders;
using FluentValidation;

public sealed class GetHotelProvidersQueryValidator : AbstractValidator<GetHotelProvidersQuery>
{
    public GetHotelProvidersQueryValidator()
    {
        // No required fields for this query
    }
}