using Domain.Reports;

namespace Domain.Common.Repositories;

public interface IAdminOverviewRepository
{
    Task<AdminOverviewReport> GetOverview(CancellationToken cancellationToken = default);
}
