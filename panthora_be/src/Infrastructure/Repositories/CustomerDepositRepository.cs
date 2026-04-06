using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class CustomerDepositRepository(AppDbContext context) : ICustomerDepositRepository
{
    private readonly AppDbContext _context = context;

    public async Task<List<CustomerDepositEntity>> GetByBookingIdAsync(Guid bookingId)
    {
        return await _context.CustomerDeposits
            .Where(d => d.BookingId == bookingId)
            .OrderBy(d => d.DepositOrder)
            .ToListAsync();
    }

    public async Task<List<CustomerDepositEntity>> GetOverdueDepositsAsync()
    {
        return await _context.CustomerDeposits
            .Include(d => d.Booking)
            .Where(d => d.Status == DepositStatus.Pending && d.DueAt < DateTimeOffset.UtcNow)
            .OrderBy(d => d.DueAt)
            .ToListAsync();
    }
}
