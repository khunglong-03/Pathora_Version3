using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public sealed class ManagerBankAccountRepository(AppDbContext context) : IManagerBankAccountRepository
{
    private readonly AppDbContext _context = context;

    public async Task<List<ManagerBankAccountEntity>> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.ManagerBankAccounts
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedOnUtc)
            .ToListAsync(ct);
    }

    public async Task<ManagerBankAccountEntity?> GetByIdAndUserIdAsync(Guid id, Guid userId, CancellationToken ct = default)
    {
        return await _context.ManagerBankAccounts
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, ct);
    }

    public async Task<ManagerBankAccountEntity?> GetDefaultByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.ManagerBankAccounts
            .FirstOrDefaultAsync(a => a.UserId == userId && a.IsDefault, ct);
    }

    public async Task<bool> AnyByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.ManagerBankAccounts
            .AnyAsync(a => a.UserId == userId, ct);
    }

    public async Task<int> CountByUserIdAsync(Guid userId, Guid? excludeId = null, CancellationToken ct = default)
    {
        var query = _context.ManagerBankAccounts.Where(a => a.UserId == userId);
        if (excludeId.HasValue)
            query = query.Where(a => a.Id != excludeId.Value);
        return await query.CountAsync(ct);
    }

    public async Task<ManagerBankAccountEntity?> GetLatestByUserIdAsync(Guid userId, Guid? excludeId = null, CancellationToken ct = default)
    {
        var query = _context.ManagerBankAccounts.Where(a => a.UserId == userId);
        if (excludeId.HasValue)
            query = query.Where(a => a.Id != excludeId.Value);
        return await query.OrderByDescending(a => a.CreatedOnUtc).FirstOrDefaultAsync(ct);
    }

    public async Task AddAsync(ManagerBankAccountEntity entity, CancellationToken ct = default)
    {
        await _context.ManagerBankAccounts.AddAsync(entity, ct);
    }

    public void Remove(ManagerBankAccountEntity entity)
    {
        _context.ManagerBankAccounts.Remove(entity);
    }

    public async Task<List<ManagerBankAccountEntity>> GetAllWithUserAsync(string? search, int pageNumber, int pageSize, CancellationToken ct = default)
    {
        var query = _context.ManagerBankAccounts
            .Include(a => a.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(a =>
                (a.User.Username != null && a.User.Username.ToLower().Contains(term)) ||
                (a.User.FullName != null && a.User.FullName.ToLower().Contains(term)) ||
                (a.User.Email != null && a.User.Email.ToLower().Contains(term)) ||
                (a.BankAccountNumber != null && a.BankAccountNumber.Contains(term)));
        }

        return await query
            .OrderByDescending(a => a.IsDefault)
            .ThenByDescending(a => a.CreatedOnUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
    }

    public async Task<int> CountAllAsync(string? search, CancellationToken ct = default)
    {
        var query = _context.ManagerBankAccounts
            .Include(a => a.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(a =>
                (a.User.Username != null && a.User.Username.ToLower().Contains(term)) ||
                (a.User.FullName != null && a.User.FullName.ToLower().Contains(term)) ||
                (a.User.Email != null && a.User.Email.ToLower().Contains(term)) ||
                (a.BankAccountNumber != null && a.BankAccountNumber.Contains(term)));
        }

        return await query.CountAsync(ct);
    }

    public async Task<ManagerBankAccountEntity?> GetDefaultByManagerIdAsync(Guid managerId, CancellationToken ct = default)
    {
        return await _context.ManagerBankAccounts
            .FirstOrDefaultAsync(a => a.UserId == managerId && a.IsDefault, ct);
    }
}
