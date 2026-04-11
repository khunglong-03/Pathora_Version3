using Domain.Reports;

namespace Domain.Common.Repositories;

public interface IManagerDashboardRepository
{
    Task<ManagerDashboardReport> GetDashboard(Guid managerId, CancellationToken cancellationToken = default);
}
