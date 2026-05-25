using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Reports;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Admin.Queries;

public sealed record GetAdminOverviewQuery(Guid? ManagerId = null) : IQuery<ErrorOr<AdminOverviewReport>>, ICacheable
{
    public string CacheKey => ManagerId.HasValue 
        ? $"{Common.CacheKey.Admin}:overview:manager:{ManagerId.Value}" 
        : $"{Common.CacheKey.Admin}:overview";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);
}

public sealed class GetAdminOverviewQueryHandler(IAdminOverviewRepository adminOverviewRepository)
    : IQueryHandler<GetAdminOverviewQuery, ErrorOr<AdminOverviewReport>>
{
    public async Task<ErrorOr<AdminOverviewReport>> Handle(GetAdminOverviewQuery request, CancellationToken cancellationToken)
    {
        return await adminOverviewRepository.GetOverview(request.ManagerId, cancellationToken);
    }
}
