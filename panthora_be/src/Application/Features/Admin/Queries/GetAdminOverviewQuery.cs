using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Reports;
using ErrorOr;

namespace Application.Features.Admin.Queries;

public sealed record GetAdminOverviewQuery : IQuery<ErrorOr<AdminOverviewReport>>, ICacheable
{
    public string CacheKey => $"{Common.CacheKey.Admin}:overview";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetAdminOverviewQueryHandler(IAdminOverviewRepository adminOverviewRepository)
    : IQueryHandler<GetAdminOverviewQuery, ErrorOr<AdminOverviewReport>>
{
    public async Task<ErrorOr<AdminOverviewReport>> Handle(GetAdminOverviewQuery request, CancellationToken cancellationToken)
    {
        return await adminOverviewRepository.GetOverview(cancellationToken);
    }
}
