using Application.Common;
using BuildingBlocks.CORS;
using Contracts.Interfaces;
using Domain.Common.Repositories;
using Domain.Reports;
using ErrorOr;
using System.Text.Json.Serialization;

namespace Application.Features.Manager.Queries;

public sealed record GetManagerDashboardQuery([property: JsonPropertyName("managerId")] Guid ManagerId) : IQuery<ErrorOr<ManagerDashboardReport>>, ICacheable
{
    public string CacheKey => $"manager:dashboard:{ManagerId}";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(3);
}

public sealed class GetManagerDashboardQueryHandler(IManagerDashboardRepository repository)
    : IQueryHandler<GetManagerDashboardQuery, ErrorOr<ManagerDashboardReport>>
{
    public async Task<ErrorOr<ManagerDashboardReport>> Handle(GetManagerDashboardQuery request, CancellationToken cancellationToken)
    {
        return await repository.GetDashboard(request.ManagerId, cancellationToken);
    }
}
