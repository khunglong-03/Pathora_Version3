using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TourInstanceRepository(AppDbContext context) : ITourInstanceRepository
{
    private readonly AppDbContext _context = context;

    public async Task<TourInstanceEntity?> FindById(Guid id, bool asNoTracking = false, CancellationToken cancellationToken = default)
    {
        var query = asNoTracking
            ? _context.TourInstances.AsNoTracking()
            : _context.TourInstances;

        return await query
            .Include(t => t.Managers).ThenInclude(m => m.User)
            .Include(t => t.InstanceDays)
            .AsSplitQuery()
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, cancellationToken);
    }

    public async Task<List<TourInstanceEntity>> FindByIds(IEnumerable<Guid> ids, CancellationToken cancellationToken = default)
    {
        var idList = ids.ToList();
        if (idList.Count == 0)
            return [];
        var idSet = new HashSet<Guid>(idList);
        return await _context.TourInstances
            .AsNoTracking()
            .Where(t => idSet.Contains(t.Id) && !t.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<TourInstanceEntity>> FindAll(string? searchText, TourInstanceStatus? status, int pageNumber, int pageSize, bool excludePast = false, Guid? principalId = null, CancellationToken cancellationToken = default)
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

        if (excludePast)
        {
            var now = DateTimeOffset.UtcNow;
            query = query.Where(t => t.EndDate >= now);
        }

        if (principalId.HasValue)
        {
            var designerIds = await _context.TourManagerAssignments
                .AsNoTracking()
                .Where(a => a.TourManagerId == principalId.Value
                            && a.AssignedEntityType == AssignedEntityType.TourDesigner
                            && a.AssignedUserId != null)
                .Select(a => a.AssignedUserId!.Value)
                .ToListAsync(cancellationToken);

            if (!designerIds.Contains(principalId.Value))
            {
                designerIds.Add(principalId.Value);
            }

            // Subquery: tour IDs where TourDesignerId is in designerIds
            var allowedTourIds = _context.Tours
                .AsNoTracking()
                .Where(t => !t.IsDeleted && t.TourDesignerId.HasValue && designerIds.Contains(t.TourDesignerId.Value))
                .Select(t => t.Id);

            // Subquery: instance IDs directly assigned to principal
            var allowedInstanceIds = _context.Set<TourInstanceManagerEntity>()
                .AsNoTracking()
                .Where(m => m.UserId == principalId.Value)
                .Select(m => m.TourInstanceId);

            query = query.Where(ti => allowedTourIds.Contains(ti.TourId) || allowedInstanceIds.Contains(ti.Id));
        }

        return await query
            .OrderByDescending(t => t.CreatedOnUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountAll(string? searchText, TourInstanceStatus? status, bool excludePast = false, Guid? principalId = null, CancellationToken cancellationToken = default)
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

        if (excludePast)
        {
            var now = DateTimeOffset.UtcNow;
            query = query.Where(t => t.EndDate >= now);
        }

        if (principalId.HasValue)
        {
            var designerIds = await _context.TourManagerAssignments
                .AsNoTracking()
                .Where(a => a.TourManagerId == principalId.Value
                            && a.AssignedEntityType == AssignedEntityType.TourDesigner
                            && a.AssignedUserId != null)
                .Select(a => a.AssignedUserId!.Value)
                .ToListAsync(cancellationToken);

            if (!designerIds.Contains(principalId.Value))
            {
                designerIds.Add(principalId.Value);
            }

            var allowedTourIds = _context.Tours
                .AsNoTracking()
                .Where(t => !t.IsDeleted && t.TourDesignerId.HasValue && designerIds.Contains(t.TourDesignerId.Value))
                .Select(t => t.Id);

            var allowedInstanceIds = _context.Set<TourInstanceManagerEntity>()
                .AsNoTracking()
                .Where(m => m.UserId == principalId.Value)
                .Select(m => m.TourInstanceId);

            query = query.Where(ti => allowedTourIds.Contains(ti.TourId) || allowedInstanceIds.Contains(ti.Id));
        }

        return await query.CountAsync(cancellationToken);
    }

    public async Task<TourInstanceEntity?> FindByIdWithInstanceDays(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.TourInstances
            .AsNoTracking()
            .AsSplitQuery()
            .Include(t => t.Managers).ThenInclude(m => m.User)

            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.Vehicle)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.Driver)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.TransportSupplier)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.Accommodation!).ThenInclude(acc => acc.Supplier)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.RoomBlocks)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.TransportAssignments)
                .ThenInclude(x => x.Vehicle)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.TransportAssignments)
                .ThenInclude(x => x.Driver)
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, cancellationToken);
    }

    public async Task<TourInstanceEntity?> FindByIdWithInstanceDaysForUpdate(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.TourInstances
            .AsSplitQuery()
            .Include(t => t.Managers).ThenInclude(m => m.User)

            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.Vehicle)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.Driver)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.TransportSupplier)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.Accommodation!).ThenInclude(acc => acc.Supplier)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.RoomBlocks)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.TransportAssignments)
                .ThenInclude(x => x.Vehicle)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.TransportAssignments)
                .ThenInclude(x => x.Driver)
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, cancellationToken);
    }

    public async Task Create(TourInstanceEntity tourInstance, CancellationToken cancellationToken = default)
    {
        await _context.TourInstances.AddAsync(tourInstance, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task Update(TourInstanceEntity tourInstance, CancellationToken cancellationToken = default)
    {
        _context.TourInstances.Update(tourInstance);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task SoftDelete(Guid id, CancellationToken cancellationToken = default)
    {
        var instance = await _context.TourInstances.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (instance is not null)
        {
            instance.IsDeleted = true;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<(int Total, int Available, int Confirmed, int SoldOut, int Completed)> GetStats(CancellationToken cancellationToken = default)
    {
        var statusCounts = await _context.TourInstances
            .Where(t => !t.IsDeleted)
            .GroupBy(t => t.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var countMap = statusCounts.ToDictionary(x => x.Status, x => x.Count);
        var total = countMap.Values.Sum();
        var available = countMap.GetValueOrDefault(TourInstanceStatus.Available);
        var confirmed = countMap.GetValueOrDefault(TourInstanceStatus.Confirmed);
        var soldOut = countMap.GetValueOrDefault(TourInstanceStatus.SoldOut);
        var completed = countMap.GetValueOrDefault(TourInstanceStatus.Completed);
        return (total, available, confirmed, soldOut, completed);
    }

    public async Task<List<TourInstanceEntity>> FindPublicAvailable(string? destination, string? sortBy, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _context.TourInstances
            .AsNoTracking()
            .AsSplitQuery()
            .Include(t => t.Tour)
            .Include(t => t.Classification)
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
            "price-low" => query.OrderBy(t => t.BasePrice).ThenBy(t => t.Id),
            "price-high" => query.OrderByDescending(t => t.BasePrice).ThenByDescending(t => t.Id),
            "duration-short" => query.OrderBy(t => t.DurationDays).ThenBy(t => t.Id),
            "duration-long" => query.OrderByDescending(t => t.DurationDays).ThenByDescending(t => t.Id),
            "recommended" or _ => query.OrderBy(t => t.StartDate).ThenBy(t => t.Id),
        };

        return await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountPublicAvailable(string? destination, CancellationToken cancellationToken = default)
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

        return await query.CountAsync(cancellationToken);
    }

    public async Task<TourInstanceEntity?> FindPublicById(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.TourInstances
            .AsNoTracking()
            .AsSplitQuery()
            .Include(t => t.Thumbnail)
            .Include(t => t.Images)
            .Include(t => t.Managers).ThenInclude(m => m.User)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.Vehicle)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.Driver)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.Accommodation)
            .FirstOrDefaultAsync(t => t.Id == id
                && !t.IsDeleted
                && t.InstanceType == TourType.Public
                && t.Status == TourInstanceStatus.Available, cancellationToken);
    }

    public async Task<TourInstanceDayEntity?> FindInstanceDayById(Guid instanceId, Guid dayId, CancellationToken cancellationToken = default)
    {
        return await _context.TourInstanceDays
            .AsNoTracking()
            .Include(d => d.Activities).ThenInclude(a => a.Vehicle)
            .Include(d => d.Activities).ThenInclude(a => a.Driver)
            .Include(d => d.Activities).ThenInclude(a => a.Accommodation)
            .AsSplitQuery()
            .FirstOrDefaultAsync(d => d.Id == dayId && d.TourInstanceId == instanceId, cancellationToken);
    }

    public async Task<TourDayActivityEntity?> FindTourDayActivityById(Guid tourDayId, Guid activityId, CancellationToken cancellationToken = default)
    {
        return await _context.TourDayActivities
            .AsNoTracking()
            .Include(a => a.FromLocation)
            .Include(a => a.ToLocation)
            .Include(a => a.Accommodation)
            .FirstOrDefaultAsync(a => a.Id == activityId && a.TourDayId == tourDayId && !a.IsDeleted, cancellationToken);
    }

    public async Task UpdateInstanceDay(TourInstanceDayEntity day, CancellationToken cancellationToken = default)
    {
        _context.TourInstanceDays.Update(day);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task AddDay(TourInstanceDayEntity day, CancellationToken cancellationToken = default)
    {
        await _context.TourInstanceDays.AddAsync(day, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateTourDayActivity(TourDayActivityEntity activity, CancellationToken cancellationToken = default)
    {
        _context.TourDayActivities.Update(activity);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<TourInstanceEntity>> FindDuplicate(Guid tourId, Guid classificationId, DateTimeOffset startDate, CancellationToken cancellationToken = default)
    {
        return await _context.TourInstances
            .AsNoTracking()
            .Where(t => !t.IsDeleted
                && t.TourId == tourId
                && t.ClassificationId == classificationId
                && t.StartDate.Date == startDate.Date)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<TourInstanceEntity>> FindProviderAssigned(Guid providerId, int pageNumber, int pageSize, ProviderApprovalStatus? approvalStatus = null, CancellationToken cancellationToken = default)
    {
        var activityQuery = _context.TourInstanceDayActivities.AsNoTracking()
            .Where(a => a.TransportSupplierId == providerId || (a.Accommodation != null && a.Accommodation.SupplierId == providerId));

        if (approvalStatus.HasValue)
        {
            var status = approvalStatus.Value;
            activityQuery = activityQuery.Where(a =>
                (a.TransportSupplierId == providerId && a.TransportationApprovalStatus == status) ||
                (a.Accommodation != null && a.Accommodation.SupplierId == providerId && a.Accommodation.SupplierApprovalStatus == status));
        }

        var instanceIds = activityQuery
            .Select(a => a.TourInstanceDay.TourInstanceId)
            .Distinct();

        var query = _context.TourInstances
            .AsNoTracking()
            .Include(t => t.Tour)
            .Include(t => t.Classification)
            .Include(t => t.Thumbnail)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.Accommodation)
            .Include(t => t.InstanceDays).ThenInclude(d => d.Activities).ThenInclude(a => a.TransportSupplier)
            .Where(t => !t.IsDeleted && instanceIds.Contains(t.Id));

        return await query
            .OrderByDescending(t => t.CreatedOnUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountProviderAssigned(Guid providerId, ProviderApprovalStatus? approvalStatus = null, CancellationToken cancellationToken = default)
    {
        var activityQuery = _context.TourInstanceDayActivities.AsNoTracking()
            .Where(a => a.TransportSupplierId == providerId || (a.Accommodation != null && a.Accommodation.SupplierId == providerId));

        if (approvalStatus.HasValue)
        {
            var status = approvalStatus.Value;
            activityQuery = activityQuery.Where(a =>
                (a.TransportSupplierId == providerId && a.TransportationApprovalStatus == status) ||
                (a.Accommodation != null && a.Accommodation.SupplierId == providerId && a.Accommodation.SupplierApprovalStatus == status));
        }

        var instanceIds = activityQuery
            .Select(a => a.TourInstanceDay.TourInstanceId)
            .Distinct();

        return await _context.TourInstances
            .Where(t => !t.IsDeleted && instanceIds.Contains(t.Id))
            .CountAsync(cancellationToken);
    }

    public async Task<List<TourInstanceEntity>> FindByManagerUserIds(IEnumerable<Guid> userIds, CancellationToken cancellationToken = default)
    {
        var userIdList = userIds.ToList();
        if (userIdList.Count == 0) return [];

        var userIdSet = new HashSet<Guid>(userIdList);

        return await _context.TourInstances
            .AsNoTracking()
            .Include(t => t.Managers)
            .Where(t => !t.IsDeleted
                && t.Managers.Any(m => userIdSet.Contains(m.UserId))
                && t.Status != TourInstanceStatus.Completed
                && t.Status != TourInstanceStatus.Cancelled)
            .OrderByDescending(t => t.StartDate)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
    }

    public async Task<List<TourInstanceEntity>> FindConflictingInstancesForManagers(IEnumerable<Guid> userIds, DateTimeOffset startDate, DateTimeOffset endDate, Guid? excludeInstanceId = null, CancellationToken cancellationToken = default)
    {
        var userIdList = userIds.ToList();
        if (userIdList.Count == 0) return [];

        var userIdSet = new HashSet<Guid>(userIdList);

        var query = _context.TourInstances
            .AsNoTracking()
            .Include(t => t.Managers).ThenInclude(m => m.User)
            .Where(t => !t.IsDeleted
                && t.Status != TourInstanceStatus.Completed
                && t.Status != TourInstanceStatus.Cancelled
                && t.Managers.Any(m => userIdSet.Contains(m.UserId))
                && t.StartDate.Date <= endDate.Date
                && t.EndDate.Date >= startDate.Date);

        if (excludeInstanceId.HasValue)
        {
            query = query.Where(t => t.Id != excludeInstanceId.Value);
        }

        return await query.ToListAsync(cancellationToken);
    }

    public async Task<int> CountByGuideUserId(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.TourInstances
            .Where(t => !t.IsDeleted
                && t.Managers.Any(m => m.UserId == userId && m.Role == TourInstanceManagerRole.Guide)
                && t.Status != TourInstanceStatus.Completed
                && t.Status != TourInstanceStatus.Cancelled)
            .CountAsync(cancellationToken);
    }

    public async Task<List<TourInstanceEntity>> FindByGuideUserId(Guid userId, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        return await _context.TourInstances
            .AsNoTracking()
            .Include(t => t.Managers)
            .Include(t => t.Tour)
            .Include(t => t.Classification)
            .Include(t => t.Thumbnail)
            .Where(t => !t.IsDeleted
                && t.Managers.Any(m => m.UserId == userId && m.Role == TourInstanceManagerRole.Guide)
                && t.Status != TourInstanceStatus.Completed
                && t.Status != TourInstanceStatus.Cancelled)
            .OrderByDescending(t => t.StartDate)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasGuideAssignmentAsync(Guid tourInstanceId, Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.TourInstanceManagers
            .AsNoTracking()
            .AnyAsync(m => m.TourInstanceId == tourInstanceId
                && m.UserId == userId
                && m.Role == TourInstanceManagerRole.Guide, cancellationToken);
    }

    public async Task<UserEntity?> FindUserByIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted, cancellationToken);
    }
}
