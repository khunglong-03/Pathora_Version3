using Domain.Reports;

namespace Domain.Common.Repositories;

public interface IAdminDashboardRepository
{
    Task<AdminDashboardReport> GetDashboard(CancellationToken cancellationToken = default);
}
