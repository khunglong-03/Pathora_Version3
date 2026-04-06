using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TourInstanceRepository(AppDbContext context) : ITourInstanceRepository
{
    private readonly AppDbContext _context = context;

    public async Task<TourInstanceEntity?> FindById(Guid id, bool asNoTracking = false)
    {
        var query = asNoTracking
            ? _context.TourInstances.AsNoTracking()
            : _context.TourInstances;

        return await query
            .Include(t => t.Managers).ThenInclude(m => m.User)
            .Include(t => t.InstanceDays)
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);
    }

    public async Task<List<TourInstanceEntity>> FindAll(string? searchText, TourInstanceStatus? status, int pageNumber, int pageSize)
    {
        var query = _context.TourInstances.AsNoTracking()
            .AsSplitQuery()
            .Include(t => t.Tour)
            .Include(t => t.Classification)
            .Include(t => t.Images)
            .Include(t => t.Thumbnail)
            .Include(t => t.Managers).ThenInclude(m => m.User)
            .Where(t => !t.IsDeleted);

        if (!string.IsNullOrWhiteSpace(searchText))
        {
            var search = searchText.ToLower();
            query = query.Where(t =>
                t.TourName.ToLower().Contains(search) ||
                t.TourCode.ToLower().Contains(search) ||
                (t.Location != null && t.Location.ToLower().Contains(search)));
        }

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        return await query
            .OrderByDescending(t => t.CreatedOnUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> CountAll(string? searchText, TourInstanceStatus? status)
    {
        var query = _context.TourInstances.Where(t => !t.IsDeleted);

        if (!string.IsNullOrWhiteSpace(searchText))
        {
            var search = searchText.ToLower();
            query = query.Where(t =>
                t.TourName.ToLower().Contains(search) ||
                t.TourCode.ToLower().Contains(search) ||
                (t.Location != null && t.Location.ToLower().Contains(search)));
        }

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        return await query.CountAsync();
    }

    public async Task<TourInstanceEntity?> FindByIdWithInstanceDays(Guid id)
    {
        return await _context.TourInstances
            .AsNoTracking()
            .AsSplitQuery()
            .Include(t => t.Managers).ThenInclude(m => m.User)
            .Include(t => t.InstanceDays).ThenInclude(d => d.TourDay).ThenInclude(td => td.Activities).ThenInclude(a => a.Routes).ThenInclude(r => r.FromLocation)
            .Include(t => t.InstanceDays).ThenInclude(d => d.TourDay).ThenInclude(td => td.Activities).ThenInclude(a => a.Routes).ThenInclude(r => r.ToLocation)
            .Include(t => t.InstanceDays).ThenInclude(d => d.TourDay).ThenInclude(td => td.Activities).ThenInclude(a => a.Accommodation)
            .Include(t => t.InstanceDays).ThenInclude(d => d.TourDay).ThenInclude(td => td.Activities).ThenInclude(a => a.ResourceLinks)
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted);
    }

    public async Task Create(TourInstanceEntity tourInstance)
    {
        await _context.TourInstances.AddAsync(tourInstance);
        await _context.SaveChangesAsync();
    }

    public async Task Update(TourInstanceEntity tourInstance)
    {
        _context.TourInstances.Update(tourInstance);
        await _context.SaveChangesAsync();
    }

    public async Task SoftDelete(Guid id)
    {
        var instance = await _context.TourInstances.FirstOrDefaultAsync(t => t.Id == id);
        if (instance is not null)
        {
            instance.IsDeleted = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<(int Total, int Available, int Confirmed, int SoldOut)> GetStats()
    {
        var query = _context.TourInstances.Where(t => !t.IsDeleted);
        var total = await query.CountAsync();
        var available = await query.CountAsync(t => t.Status == TourInstanceStatus.Available);
        var confirmed = await query.CountAsync(t => t.Status == TourInstanceStatus.Confirmed);
        var soldOut = await query.CountAsync(t => t.Status == TourInstanceStatus.SoldOut);
        return (total, available, confirmed, soldOut);
    }

    public async Task<List<TourInstanceEntity>> FindPublicAvailable(string? destination, string? sortBy, int page, int pageSize)
    {
        var query = _context.TourInstances
            .AsNoTracking()
            .AsSplitQuery()
            .Include(t => t.Thumbnail)
            .Include(t => t.Images)
            .Include(t => t.Managers).ThenInclude(m => m.User)
            .Where(t => !t.IsDeleted
                && t.InstanceType == TourType.Public
                && t.Status == TourInstanceStatus.Available);

        if (!string.IsNullOrWhiteSpace(destination))
        {
            var destLower = destination.ToLower();
            query = query.Where(t => t.Location != null && t.Location.ToLower().Contains(destLower));
        }

        query = sortBy switch
        {
            "price-low" => query.OrderBy(t => t.BasePrice).ThenBy(t => t.StartDate),
            "price-high" => query.OrderByDescending(t => t.BasePrice).ThenByDescending(t => t.StartDate),
            "duration-short" => query.OrderBy(t => (t.EndDate - t.StartDate).TotalDays),
            "duration-long" => query.OrderByDescending(t => (t.EndDate - t.StartDate).TotalDays),
            "recommended" or _ => query.OrderBy(t => t.StartDate),
        };

        return await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> CountPublicAvailable(string? destination)
    {
        var query = _context.TourInstances
            .Where(t => !t.IsDeleted
                && t.InstanceType == TourType.Public
                && t.Status == TourInstanceStatus.Available);

        if (!string.IsNullOrWhiteSpace(destination))
        {
            var destLower = destination.ToLower();
            query = query.Where(t => t.Location != null && t.Location.ToLower().Contains(destLower));
        }

        return await query.CountAsync();
    }

    public async Task<TourInstanceEntity?> FindPublicById(Guid id)
    {
        return await _context.TourInstances
            .AsNoTracking()
            .AsSplitQuery()
            .Include(t => t.Thumbnail)
            .Include(t => t.Images)
            .Include(t => t.Managers).ThenInclude(m => m.User)
            .Include(t => t.InstanceDays).ThenInclude(d => d.TourDay).ThenInclude(td => td.Activities).ThenInclude(a => a.Routes).ThenInclude(r => r.FromLocation)
            .Include(t => t.InstanceDays).ThenInclude(d => d.TourDay).ThenInclude(td => td.Activities).ThenInclude(a => a.Routes).ThenInclude(r => r.ToLocation)
            .Include(t => t.InstanceDays).ThenInclude(d => d.TourDay).ThenInclude(td => td.Activities).ThenInclude(a => a.Accommodation)
            .Include(t => t.InstanceDays).ThenInclude(d => d.TourDay).ThenInclude(td => td.Activities).ThenInclude(a => a.ResourceLinks)
            .FirstOrDefaultAsync(t => t.Id == id
                && !t.IsDeleted
                && t.InstanceType == TourType.Public
                && t.Status == TourInstanceStatus.Available);
    }

    public async Task<TourInstanceDayEntity?> FindInstanceDayById(Guid instanceId, Guid dayId)
    {
        return await _context.TourInstanceDays
            .AsNoTracking()
            .Include(d => d.TourDay).ThenInclude(td => td.Activities).ThenInclude(a => a.Routes).ThenInclude(r => r.FromLocation)
            .Include(d => d.TourDay).ThenInclude(td => td.Activities).ThenInclude(a => a.Routes).ThenInclude(r => r.ToLocation)
            .Include(d => d.TourDay).ThenInclude(td => td.Activities).ThenInclude(a => a.Accommodation)
            .Include(d => d.TourDay).ThenInclude(td => td.Activities).ThenInclude(a => a.ResourceLinks)
            .FirstOrDefaultAsync(d => d.Id == dayId && d.TourInstanceId == instanceId);
    }

    public async Task<TourDayActivityEntity?> FindTourDayActivityById(Guid tourDayId, Guid activityId)
    {
        return await _context.TourDayActivities
            .AsNoTracking()
            .Include(a => a.Routes).ThenInclude(r => r.FromLocation)
            .Include(a => a.Routes).ThenInclude(r => r.ToLocation)
            .Include(a => a.Accommodation)
            .Include(a => a.ResourceLinks)
            .FirstOrDefaultAsync(a => a.Id == activityId && a.TourDayId == tourDayId && !a.IsDeleted);
    }

    public async Task UpdateInstanceDay(TourInstanceDayEntity day)
    {
        _context.TourInstanceDays.Update(day);
        await _context.SaveChangesAsync();
    }

    public async Task AddDay(TourInstanceDayEntity day)
    {
        await _context.TourInstanceDays.AddAsync(day);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateTourDayActivity(TourDayActivityEntity activity)
    {
        _context.TourDayActivities.Update(activity);
        await _context.SaveChangesAsync();
    }

    public async Task<List<TourInstanceEntity>> FindDuplicate(Guid tourId, Guid classificationId, DateTimeOffset startDate)
    {
        return await _context.TourInstances
            .AsNoTracking()
            .Where(t => !t.IsDeleted
                && t.TourId == tourId
                && t.ClassificationId == classificationId
                && t.StartDate.Date == startDate.Date)
            .ToListAsync();
    }
}
