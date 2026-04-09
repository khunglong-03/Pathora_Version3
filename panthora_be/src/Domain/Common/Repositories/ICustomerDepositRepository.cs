using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ICustomerDepositRepository
{
    Task<List<CustomerDepositEntity>> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default);
    Task<List<CustomerDepositEntity>> GetOverdueDepositsAsync(CancellationToken cancellationToken = default);
}
