using Domain.Reports;

namespace Domain.Common.Repositories;

public interface IAdminOverviewRepository
{
    Task<AdminOverviewReport> GetOverview(Guid? managerId = null, CancellationToken cancellationToken = default);
}
