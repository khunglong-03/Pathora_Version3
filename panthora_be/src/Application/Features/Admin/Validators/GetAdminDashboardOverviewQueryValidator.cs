namespace Application.Features.Admin.Validators;

using Application.Features.Admin.Queries.GetAdminDashboardOverview;
using FluentValidation;

public sealed class GetAdminDashboardOverviewQueryValidator : AbstractValidator<GetAdminDashboardOverviewQuery>
{
    public GetAdminDashboardOverviewQueryValidator()
    {
        // No required fields for this query
    }
}