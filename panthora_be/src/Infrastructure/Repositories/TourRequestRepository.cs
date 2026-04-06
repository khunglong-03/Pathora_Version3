using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TourRequestRepository(AppDbContext context) : ITourRequestRepository
{
    private readonly AppDbContext _context = context;

    public async Task AddAsync(TourRequestEntity entity)
    {
        await _context.TourRequests.AddAsync(entity);
    }

    public Task UpdateAsync(TourRequestEntity entity)
    {
        _context.TourRequests.Update(entity);
        return Task.CompletedTask;
    }

    public async Task<TourRequestEntity?> GetByIdAsync(Guid id, bool asNoTracking = false)
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

        return await query.FirstOrDefaultAsync();
    }

    public async Task<List<TourRequestEntity>> GetByUserIdAsync(
        Guid userId,
        int pageNumber = 1,
        int pageSize = 10,
        bool asNoTracking = false)
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

        return await query.ToListAsync();
    }

    public async Task<int> CountByUserIdAsync(Guid userId)
    {
        return await _context.TourRequests
            .AsNoTracking()
            .CountAsync(t => t.UserId == userId);
    }

    public async Task<List<TourRequestEntity>> GetAllAsync(
        TourRequestStatus? status = null,
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null,
        string? searchText = null,
        int pageNumber = 1,
        int pageSize = 10,
        bool asNoTracking = false)
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

        return await query.ToListAsync();
    }

    public async Task<int> CountAllAsync(
        TourRequestStatus? status = null,
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null,
        string? searchText = null)
    {
        var query = ApplyFilters(status, fromDate, toDate, searchText);
        return await query.AsNoTracking().CountAsync();
    }

    public async Task<List<TourRequestEntity>> GetByStatusAsync(TourRequestStatus status)
    {
        return await GetAllAsync(status: status, asNoTracking: true);
    }

    public async Task<int> CountByStatusAsync(TourRequestStatus status)
    {
        return await CountAllAsync(status: status);
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
