using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public sealed class WithdrawalRequestRepository(AppDbContext context) : IWithdrawalRequestRepository
{
    private readonly AppDbContext _context = context;

    public async Task<WithdrawalRequestEntity?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.WithdrawalRequests.FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    public async Task<WithdrawalRequestEntity?> GetByIdWithUserAsync(Guid id, CancellationToken ct = default)
    {
        return await _context.WithdrawalRequests
            .Include(x => x.User)
            .Include(x => x.BankAccount)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    public async Task<List<WithdrawalRequestEntity>> GetByUserIdAsync(Guid userId, WithdrawalStatus? status, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _context.WithdrawalRequests.Where(x => x.UserId == userId);

        if (status.HasValue)
        {
            query = query.Where(x => x.Status == status.Value);
        }

        return await query
            .OrderByDescending(x => x.CreatedOnUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
    }

    public async Task<int> CountByUserIdAsync(Guid userId, WithdrawalStatus? status, CancellationToken ct = default)
    {
        var query = _context.WithdrawalRequests.Where(x => x.UserId == userId);

        if (status.HasValue)
        {
            query = query.Where(x => x.Status == status.Value);
        }

        return await query.CountAsync(ct);
    }

    public async Task<List<WithdrawalRequestEntity>> GetAllAsync(WithdrawalStatus? status, string? search, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _context.WithdrawalRequests
            .Include(x => x.User)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(x => x.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x => 
                (x.User.Username != null && x.User.Username.ToLower().Contains(term)) ||
                (x.User.FullName != null && x.User.FullName.ToLower().Contains(term)) ||
                (x.User.Email != null && x.User.Email.ToLower().Contains(term)));
        }

        return await query
            .OrderByDescending(x => x.CreatedOnUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
    }

    public async Task<int> CountAllAsync(WithdrawalStatus? status, string? search, CancellationToken ct = default)
    {
        var query = _context.WithdrawalRequests
            .Include(x => x.User)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(x => x.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(x => 
                (x.User.Username != null && x.User.Username.ToLower().Contains(term)) ||
                (x.User.FullName != null && x.User.FullName.ToLower().Contains(term)) ||
                (x.User.Email != null && x.User.Email.ToLower().Contains(term)));
        }

        return await query.CountAsync(ct);
    }

    public async Task<bool> HasPendingByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.WithdrawalRequests
            .AnyAsync(x => x.UserId == userId && x.Status == WithdrawalStatus.Pending, ct);
    }

    public async Task AddAsync(WithdrawalRequestEntity entity, CancellationToken ct = default)
    {
        await _context.WithdrawalRequests.AddAsync(entity, ct);
    }

    public void Update(WithdrawalRequestEntity entity)
    {
        _context.WithdrawalRequests.Update(entity);
    }
}
