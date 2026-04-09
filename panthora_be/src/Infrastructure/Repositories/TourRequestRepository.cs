using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TourRequestRepository(AppDbContext context) : ITourRequestRepository
{
    private readonly AppDbContext _context = context;

    public async Task AddAsync(TourRequestEntity entity, CancellationToken ct = default)
    {
        await _context.TourRequests.AddAsync(entity, ct);
    }

    public Task UpdateAsync(TourRequestEntity entity)
    {
        _context.TourRequests.Update(entity);
        return Task.CompletedTask;
    }

    public async Task<TourRequestEntity?> GetByIdAsync(Guid id, bool asNoTracking = false, CancellationToken ct = default)
    {
        var query = _context.TourRequests
            .Include(t => t.User)
            .Include(t => t.Reviewer)
            .Include(t => t.TourInstance)
            .Where(t => t.Id == id);

        if (asNoTracking)
        {
            query = query.AsNoTracking();
        }

        return await query.FirstOrDefaultAsync(ct);
    }

    public async Task<List<TourRequestEntity>> GetByUserIdAsync(
        Guid userId,
        int pageNumber = 1,
        int pageSize = 10,
        bool asNoTracking = false,
        CancellationToken ct = default)
    {
        var query = _context.TourRequests
            .Where(t => t.UserId == userId);

        if (asNoTracking)
        {
            query = query.AsNoTracking();
        }

        query = query.OrderByDescending(t => t.CreatedOnUtc);

        if (pageNumber > 0 && pageSize > 0)
        {
            query = query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize);
        }

        return await query.ToListAsync(ct);
    }

    public async Task<int> CountByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _context.TourRequests
            .AsNoTracking()
            .CountAsync(t => t.UserId == userId, ct);
    }

    public async Task<List<TourRequestEntity>> GetAllAsync(
        TourRequestStatus? status = null,
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null,
        string? searchText = null,
        int pageNumber = 1,
        int pageSize = 10,
        bool asNoTracking = false,
        CancellationToken ct = default)
    {
        var query = ApplyFilters(status, fromDate, toDate, searchText);

        if (asNoTracking)
        {
            query = query.AsNoTracking();
        }

        query = query.OrderByDescending(t => t.CreatedOnUtc);

        if (pageNumber > 0 && pageSize > 0)
        {
            query = query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize);
        }

        return await query.ToListAsync(ct);
    }

    public async Task<int> CountAllAsync(
        TourRequestStatus? status = null,
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null,
        string? searchText = null,
        CancellationToken ct = default)
    {
        var query = ApplyFilters(status, fromDate, toDate, searchText);
        return await query.AsNoTracking().CountAsync(ct);
    }

    public async Task<List<TourRequestEntity>> GetByStatusAsync(TourRequestStatus status, CancellationToken ct = default)
    {
        return await GetAllAsync(status: status, asNoTracking: true, ct: ct);
    }

    public async Task<int> CountByStatusAsync(TourRequestStatus status, CancellationToken ct = default)
    {
        return await CountAllAsync(status: status, ct: ct);
    }

    private IQueryable<TourRequestEntity> ApplyFilters(
        TourRequestStatus? status,
        DateTimeOffset? fromDate,
        DateTimeOffset? toDate,
        string? searchText)
    {
        var query = _context.TourRequests.AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        if (fromDate.HasValue)
        {
            query = query.Where(t => t.DepartureDate >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(t => t.DepartureDate <= toDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchText))
        {
            var normalizedSearch = searchText.Trim().ToLowerInvariant();
            query = query.Where(t =>
                t.Destination.ToLower().Contains(normalizedSearch)
                || t.CustomerName.ToLower().Contains(normalizedSearch)
                || (t.CustomerEmail != null && t.CustomerEmail.ToLower().Contains(normalizedSearch)));
        }

        return query;
    }
}