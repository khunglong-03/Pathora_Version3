using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ICustomerPaymentRepository
{
    Task<List<CustomerPaymentEntity>> GetByBookingIdAsync(Guid bookingId);
    Task<decimal> GetTotalPaidByBookingIdAsync(Guid bookingId);
}
