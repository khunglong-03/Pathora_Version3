using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ICustomerPaymentRepository
{
    Task<List<CustomerPaymentEntity>> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default);
    Task<decimal> GetTotalPaidByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default);
}
