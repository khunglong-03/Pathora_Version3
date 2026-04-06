using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ICustomerDepositRepository
{
    Task<List<CustomerDepositEntity>> GetByBookingIdAsync(Guid bookingId);
    Task<List<CustomerDepositEntity>> GetOverdueDepositsAsync();
}
