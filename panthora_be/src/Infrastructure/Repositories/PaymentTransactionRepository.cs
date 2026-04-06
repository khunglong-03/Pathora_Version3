using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class PaymentTransactionRepository(AppDbContext context) : IPaymentTransactionRepository
{
    private readonly AppDbContext _context = context;

    public async Task<PaymentTransactionEntity?> GetByIdAsync(Guid id)
    {
        return await _context.PaymentTransactions
            .Include(x => x.Booking)
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<PaymentTransactionEntity?> GetByTransactionCodeAsync(string transactionCode)
    {
        return await _context.PaymentTransactions
            .Include(x => x.Booking)
            .FirstOrDefaultAsync(x => x.TransactionCode == transactionCode);
    }

    public async Task<PaymentTransactionEntity?> GetBySepayTransactionIdAsync(string sepayTransactionId)
    {
        return await _context.PaymentTransactions
            .Include(x => x.Booking)
            .FirstOrDefaultAsync(x => x.ExternalTransactionId == sepayTransactionId);
    }

    public async Task<PaymentTransactionEntity?> GetByBookingIdAsync(Guid bookingId)
    {
        return await _context.PaymentTransactions
            .Where(x => x.BookingId == bookingId)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<List<PaymentTransactionEntity>> GetByBookingIdListAsync(Guid bookingId)
    {
        return await _context.PaymentTransactions
            .Where(x => x.BookingId == bookingId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();
    }

    public async Task<PaymentTransactionEntity?> GetPendingByBookingIdAsync(Guid bookingId)
    {
        return await _context.PaymentTransactions
            .Where(x => x.BookingId == bookingId && x.Status == TransactionStatus.Pending)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<PaymentTransactionEntity?> FindPendingByReferenceCodeAsync(string referenceCode)
    {
        return await _context.PaymentTransactions
            .Include(x => x.Booking)
            .Where(x => x.Status == TransactionStatus.Pending && x.ReferenceCode == referenceCode)
            .FirstOrDefaultAsync();
    }

    public async Task<List<PaymentTransactionEntity>> GetExpiredTransactionsAsync()
    {
        var now = DateTimeOffset.UtcNow;
        return await _context.PaymentTransactions
            .Where(x => x.Status == TransactionStatus.Pending && x.ExpiredAt != null && x.ExpiredAt < now)
            .ToListAsync();
    }

    public async Task<List<PaymentTransactionEntity>> GetPendingTransactionsAsync()
    {
        return await _context.PaymentTransactions
            .Include(x => x.Booking)
            .Where(x => x.Status == TransactionStatus.Pending)
            .ToListAsync();
    }

    public async Task<List<PaymentTransactionEntity>> GetAllAsync(int pageNumber = 1, int pageSize = 20)
    {
        return await _context.PaymentTransactions
            .Include(x => x.Booking)
            .OrderByDescending(x => x.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetTotalCountAsync()
    {
        return await _context.PaymentTransactions.CountAsync();
    }

    public async Task AddAsync(PaymentTransactionEntity transaction)
    {
        await _context.PaymentTransactions.AddAsync(transaction);
    }

    public async Task UpdateAsync(PaymentTransactionEntity transaction)
    {
        _context.PaymentTransactions.Update(transaction);
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id)
    {
        var transaction = await _context.PaymentTransactions.FindAsync(id);
        if (transaction != null)
        {
            _context.PaymentTransactions.Remove(transaction);
        }
    }
}
