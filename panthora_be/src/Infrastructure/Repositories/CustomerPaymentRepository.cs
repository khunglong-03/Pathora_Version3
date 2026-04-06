using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class CustomerPaymentRepository(AppDbContext context) : ICustomerPaymentRepository
{
    private readonly AppDbContext _context = context;

    public async Task<List<CustomerPaymentEntity>> GetByBookingIdAsync(Guid bookingId)
    {
        return await _context.CustomerPayments
            .Where(p => p.BookingId == bookingId)
            .OrderByDescending(p => p.PaidAt)
            .ToListAsync();
    }

    public async Task<decimal> GetTotalPaidByBookingIdAsync(Guid bookingId)
    {
        return await _context.CustomerPayments
            .Where(p => p.BookingId == bookingId)
            .SumAsync(p => p.Amount);
    }
}
