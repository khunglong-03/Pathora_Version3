namespace Application.Features.Admin.Validators;

using Application.Features.Admin.Queries.GetTransportProviders;
using FluentValidation;

public sealed class GetTransportProvidersQueryValidator : AbstractValidator<GetTransportProvidersQuery>
{
    public GetTransportProvidersQueryValidator()
    {
        // No required fields for this query
    }
}