using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class PaymentTransactionRepository(AppDbContext context) : IPaymentTransactionRepository
{
    private readonly AppDbContext _context = context;

    public async Task<PaymentTransactionEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.PaymentTransactions
            .Include(x => x.Booking)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<PaymentTransactionEntity?> GetByTransactionCodeAsync(string transactionCode, CancellationToken cancellationToken = default)
    {
        return await _context.PaymentTransactions
            .Include(x => x.Booking)
            .FirstOrDefaultAsync(x => x.TransactionCode == transactionCode, cancellationToken);
    }

    public async Task<PaymentTransactionEntity?> GetBySepayTransactionIdAsync(string sepayTransactionId, CancellationToken cancellationToken = default)
    {
        return await _context.PaymentTransactions
            .Include(x => x.Booking)
            .FirstOrDefaultAsync(x => x.ExternalTransactionId == sepayTransactionId, cancellationToken);
    }

    public async Task<PaymentTransactionEntity?> GetByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        return await _context.PaymentTransactions
            .Where(x => x.BookingId == bookingId)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<PaymentTransactionEntity>> GetByBookingIdListAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        return await _context.PaymentTransactions
            .Where(x => x.BookingId == bookingId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<PaymentTransactionEntity?> GetPendingByBookingIdAsync(Guid bookingId, CancellationToken cancellationToken = default)
    {
        return await _context.PaymentTransactions
            .Where(x => x.BookingId == bookingId && x.Status == TransactionStatus.Pending)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<PaymentTransactionEntity?> FindPendingByReferenceCodeAsync(string referenceCode, CancellationToken cancellationToken = default)
    {
        return await _context.PaymentTransactions
            .Include(x => x.Booking)
            .Where(x => x.Status == TransactionStatus.Pending && x.ReferenceCode == referenceCode)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<PaymentTransactionEntity>> GetExpiredTransactionsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        return await _context.PaymentTransactions
            .Where(x => x.Status == TransactionStatus.Pending && x.ExpiredAt != null && x.ExpiredAt < now)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<PaymentTransactionEntity>> GetPendingTransactionsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.PaymentTransactions
            .Include(x => x.Booking)
            .Where(x => x.Status == TransactionStatus.Pending)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<PaymentTransactionEntity>> GetAllAsync(int pageNumber = 1, int pageSize = 20, CancellationToken cancellationToken = default)
    {
        return await _context.PaymentTransactions
            .Include(x => x.Booking)
            .OrderByDescending(x => x.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetTotalCountAsync(CancellationToken cancellationToken = default)
    {
        return await _context.PaymentTransactions.CountAsync(cancellationToken);
    }

    public async Task AddAsync(PaymentTransactionEntity transaction, CancellationToken cancellationToken = default)
    {
        await _context.PaymentTransactions.AddAsync(transaction, cancellationToken);
    }

    public async Task UpdateAsync(PaymentTransactionEntity transaction, CancellationToken cancellationToken = default)
    {
        _context.PaymentTransactions.Update(transaction);
        await Task.CompletedTask;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var transaction = await _context.PaymentTransactions.FindAsync([id], cancellationToken);
        if (transaction != null)
        {
            _context.PaymentTransactions.Remove(transaction);
        }
    }
}