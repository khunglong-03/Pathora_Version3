using Domain.Common.Repositories;
using Common.Extensions;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class TourRepository(AppDbContext context) : ITourRepository
{
    private readonly AppDbContext _context = context;

    public async Task<TourEntity?> FindById(Guid id, bool asNoTracking = false, CancellationToken cancellationToken = default)
    {
        var query = asNoTracking
            ? BuildTourDetailQueryNoTracking()
            : _context.Tours
                .AsSplitQuery()
                .Include(t => t.Classifications)
                    .ThenInclude(c => c.Plans)
                        .ThenInclude(p => p.Activities)
                            .ThenInclude(a => a.Accommodation);

        return await query.FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, cancellationToken);
    }

    public async Task<TourEntity?> FindByIdForUpdate(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Tours
            .Include(t => t.Classifications)
                .ThenInclude(c => c.Plans)
                    .ThenInclude(p => p.Activities)
                        .ThenInclude(a => a.FromLocation)
            .Include(t => t.Classifications)
                .ThenInclude(c => c.Plans)
                    .ThenInclude(p => p.Activities)
                        .ThenInclude(a => a.ToLocation)
            .Include(t => t.Classifications)
                .ThenInclude(c => c.Plans)
                    .ThenInclude(p => p.Activities)
                        .ThenInclude(a => a.Accommodation)
            .Include(t => t.Classifications)
                .ThenInclude(c => c.Insurances)
            .Include(t => t.PlanLocations)
            .Include(t => t.Resources)
            .Include(t => t.Thumbnail)
            .Include(t => t.Images)
            .AsSplitQuery()
            .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, cancellationToken);
    }

    private IQueryable<TourEntity> BuildTourDetailQueryNoTracking()
    {
        return _context.Tours
            .AsNoTracking()
            .Include(t => t.Classifications)
                .ThenInclude(c => c.Plans)
                    .ThenInclude(p => p.Activities)
                        .ThenInclude(a => a.FromLocation)
            .Include(t => t.Classifications)
                .ThenInclude(c => c.Plans)
                    .ThenInclude(p => p.Activities)
                        .ThenInclude(a => a.ToLocation)
            .Include(t => t.Classifications)
                .ThenInclude(c => c.Plans)
                    .ThenInclude(p => p.Activities)
                        .ThenInclude(a => a.Accommodation)
            .Include(t => t.Classifications)
                .ThenInclude(c => c.Insurances)
            .Include(t => t.Thumbnail)
            .Include(t => t.Images)
            .AsSplitQuery();
    }

    public async Task<List<TourEntity>> FindAll(string? searchText, int pageNumber, int pageSize, Guid? principalId = null, TourStatus? status = null, TourScope? tourScope = null, Continent? continent = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Tours.AsNoTracking().Where(t => !t.IsDeleted);

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        if (tourScope.HasValue)
        {
            query = query.Where(t => t.TourScope == tourScope.Value);
        }

        if (continent.HasValue)
        {
            query = query.Where(t => t.Continent == continent.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchText))
        {
            var search = searchText.ToLower();
            query = query.Where(t =>
                t.TourName.ToLower().Contains(search) ||
                t.TourCode.ToLower().Contains(search));
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

            query = query.Where(t => t.TourDesignerId != null && designerIds.Contains(t.TourDesignerId.Value));
        }

        return await query
            .Include(t => t.Thumbnail)
            .Include(t => t.Classifications)
            .Include(t => t.PlanLocations)
            .OrderByDescending(t => t.CreatedOnUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountAll(string? searchText, Guid? principalId = null, TourStatus? status = null, TourScope? tourScope = null, Continent? continent = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Tours.Where(t => !t.IsDeleted);

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        if (tourScope.HasValue)
        {
            query = query.Where(t => t.TourScope == tourScope.Value);
        }

        if (continent.HasValue)
        {
            query = query.Where(t => t.Continent == continent.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchText))
        {
            var search = searchText.ToLower();
            query = query.Where(t =>
                t.TourName.ToLower().Contains(search) ||
                t.TourCode.ToLower().Contains(search));
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

            query = query.Where(t => t.TourDesignerId != null && designerIds.Contains(t.TourDesignerId.Value));
        }

        return await query.CountAsync(cancellationToken);
    }

    public async Task<List<TourEntity>> FindAllAdmin(string? searchText, TourStatus? status, int pageNumber, int pageSize, Guid? managerId = null, TourScope? tourScope = null, Continent? continent = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Tours.AsNoTracking().Where(t => !t.IsDeleted);
        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        if (tourScope.HasValue)
        {
            query = query.Where(t => t.TourScope == tourScope.Value);
        }

        if (continent.HasValue)
        {
            query = query.Where(t => t.Continent == continent.Value);
        }
        if (!string.IsNullOrWhiteSpace(searchText))
        {
            var search = searchText.ToLower();
            query = query.Where(t =>
                t.TourName.ToLower().Contains(search) ||
                t.TourCode.ToLower().Contains(search));
        }

        if (managerId.HasValue)
        {
            var designerIds = await _context.TourManagerAssignments
                .AsNoTracking()
                .Where(a => a.TourManagerId == managerId.Value
                            && a.AssignedEntityType == AssignedEntityType.TourDesigner
                            && a.AssignedUserId != null)
                .Select(a => a.AssignedUserId!.Value)
                .ToListAsync(cancellationToken);

            if (!designerIds.Contains(managerId.Value))
            {
                designerIds.Add(managerId.Value);
            }

            query = query.Where(t => t.TourDesignerId != null && designerIds.Contains(t.TourDesignerId.Value));
        }

        return await query
            .Include(t => t.Thumbnail)
            .Include(t => t.Classifications)
            .OrderByDescending(t => t.LastModifiedOnUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountAllAdmin(string? searchText, TourStatus? status, Guid? managerId = null, TourScope? tourScope = null, Continent? continent = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Tours.Where(t => !t.IsDeleted);
        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        if (tourScope.HasValue)
        {
            query = query.Where(t => t.TourScope == tourScope.Value);
        }

        if (continent.HasValue)
        {
            query = query.Where(t => t.Continent == continent.Value);
        }
        if (!string.IsNullOrWhiteSpace(searchText))
        {
            var search = searchText.ToLower();
            query = query.Where(t =>
                t.TourName.ToLower().Contains(search) ||
                t.TourCode.ToLower().Contains(search));
        }

        if (managerId.HasValue)
        {
            var designerIds = await _context.TourManagerAssignments
                .AsNoTracking()
                .Where(a => a.TourManagerId == managerId.Value
                            && a.AssignedEntityType == AssignedEntityType.TourDesigner
                            && a.AssignedUserId != null)
                .Select(a => a.AssignedUserId!.Value)
                .ToListAsync(cancellationToken);

            if (!designerIds.Contains(managerId.Value))
            {
                designerIds.Add(managerId.Value);
            }

            query = query.Where(t => t.TourDesignerId != null && designerIds.Contains(t.TourDesignerId.Value));
        }

        return await query.CountAsync(cancellationToken);
    }

    public async Task<bool> ExistsByTourCode(string tourCode, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Tours.Where(t => !t.IsDeleted && t.TourCode == tourCode);
        if (excludeId.HasValue)
            query = query.Where(t => t.Id != excludeId.Value);
        return await query.AnyAsync(cancellationToken);
    }

    public async Task Create(TourEntity tour, CancellationToken cancellationToken = default)
    {
        await _context.Tours.AddAsync(tour, cancellationToken);
    }

    public Task Update(TourEntity tour, CancellationToken cancellationToken = default)
    {
        try
        {
            _context.Entry(tour).State = EntityState.Modified;
        }
        catch (InvalidOperationException)
        {
            // Fallback for images that aren't tracked — mark each one
            foreach (var img in tour.Images)
            {
                var imgEntry = _context.Entry(img);
                if (imgEntry.State == EntityState.Detached)
                {
                    imgEntry.State = EntityState.Added;
                }
            }
            _context.Entry(tour).State = EntityState.Modified;
        }
        return Task.CompletedTask;
    }

    public async Task SoftDelete(Guid id, CancellationToken cancellationToken = default)
    {
        var tour = await _context.Tours.FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
        if (tour != null)
        {
            tour.IsDeleted = true;
        }
    }

    public async Task<int> UpdateStatus(Guid id, TourStatus status, string userId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        // Bypasses TourEntity.Update() — only columns below are modified
        var rowsAffected = await _context.Tours
            .Where(t => t.Id == id && !t.IsDeleted)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(t => t.Status, status)
                .SetProperty(t => t.LastModifiedBy, userId)
                .SetProperty(t => t.LastModifiedOnUtc, now),
                cancellationToken);
        // NOTE: RowVersion concurrency check intentionally omitted from WHERE clause.
        // If RowVersion is added, EF will handle the increment automatically.
        return rowsAffected;
    }

    public async Task<List<TourEntity>> FindFeaturedTours(int limit, CancellationToken cancellationToken = default)
    {
        // Chỉ tour có ít nhất một instance public đang mở bán (Available). Tránh home hiển thị tour
        // còn PendingApproval / chưa kích hoạt — đồng bộ với FindPublicAvailable.
        return await WhereHasPublicAvailableInstance(
                _context.Tours
                    .AsNoTracking()
                    .Include(t => t.Thumbnail)
                    .Include(t => t.Classifications)
                    .Include(t => t.PlanLocations)
                    .Where(t => t.Status == TourStatus.Active && !t.IsDeleted))
            .OrderByDescending(t => t.CreatedOnUtc)
            .Take(limit)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
    }

    public async Task<List<TourEntity>> FindLatestTours(int limit, CancellationToken cancellationToken = default)
    {
        return await WhereHasPublicAvailableInstance(
                _context.Tours
                    .AsNoTracking()
                    .Include(t => t.Thumbnail)
                    .Where(t => t.Status == TourStatus.Active && !t.IsDeleted))
            .OrderByDescending(t => t.CreatedOnUtc)
            .Take(limit)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Giới hạn catalog public theo cùng rule list instance: public + Available
    /// (xem <see cref="TourInstanceRepository.FindPublicAvailable" />).
    /// </summary>
    private IQueryable<TourEntity> WhereHasPublicAvailableInstance(IQueryable<TourEntity> query) =>
        query.Where(t => _context.TourInstances.Any(i =>
            i.TourId == t.Id
            && !i.IsDeleted
            && i.InstanceType == TourType.Public
            && (i.Status == TourInstanceStatus.Available || i.Status == TourInstanceStatus.Confirmed || i.Status == TourInstanceStatus.SoldOut)));

    public async Task<List<TourEntity>> SearchTours(
        string? q,
        string? destination,
        string? classification,
        DateOnly? date,
        int? people,
        decimal? minPrice,
        decimal? maxPrice,
        int? minDays,
        int? maxDays,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = BuildSearchQuery(
                q,
                destination,
                classification,
                date,
                people,
                minPrice,
                maxPrice,
                minDays,
                maxDays)
            .Include(t => t.Thumbnail)
            .Include(t => t.Classifications)
            .Include(t => t.PlanLocations)
            .AsSplitQuery();

        return await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountSearchTours(
        string? q,
        string? destination,
        string? classification,
        DateOnly? date,
        int? people,
        decimal? minPrice,
        decimal? maxPrice,
        int? minDays,
        int? maxDays,
        CancellationToken cancellationToken = default)
    {
        return await BuildSearchQuery(
            q,
            destination,
            classification,
            date,
            people,
            minPrice,
            maxPrice,
            minDays,
            maxDays).CountAsync(cancellationToken);
    }

    private IQueryable<TourEntity> BuildSearchQuery(
        string? q,
        string? destination,
        string? classification,
        DateOnly? date,
        int? people,
        decimal? minPrice,
        decimal? maxPrice,
        int? minDays,
        int? maxDays)
    {
        var query = _context.Tours
            .AsNoTracking()
            .Where(t => !t.IsDeleted && t.Status == TourStatus.Active)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var search = q.ToLower();
            query = query.Where(t =>
                t.TourName.ToLower().Contains(search) ||
                t.TourCode.ToLower().Contains(search) ||
                t.Classifications
                    .SelectMany(c => c.Plans)
                    .SelectMany(p => p.Activities)
                    .Any(a =>
                        a.FromLocation != null &&
                        ((a.FromLocation.City != null && a.FromLocation.City.ToLower().Contains(search)) ||
                        (a.FromLocation.Country != null && a.FromLocation.Country.ToLower().Contains(search)))));
        }

        if (!string.IsNullOrWhiteSpace(destination))
        {
            var destLower = destination.ToLower();
            query = query.Where(t => t.Classifications
                .SelectMany(c => c.Plans)
                .SelectMany(p => p.Activities)
                .Any(a => a.FromLocation != null &&
                          ((a.FromLocation.City != null && a.FromLocation.City.ToLower().Contains(destLower)) ||
                          (a.FromLocation.Country != null && a.FromLocation.Country.ToLower().Contains(destLower)))));
        }

        if (!string.IsNullOrWhiteSpace(classification))
        {
            // Support both English and Vietnamese classification names
            var classificationLower = classification.ToLower();
            var classificationMap = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
            {
                { "standard tour", new[] { "standard", "tiêu chuẩn" } },
                { "premium tour", new[] { "premium", "cao cấp" } },
                { "vip / luxury tour", new[] { "vip", "luxury", "cao cấp" } },
                { "budget tour", new[] { "budget", "tiết kiệm" } },
                { "private tour", new[] { "private", "riêng" } },
                { "group tour", new[] { "group", "đoàn" } },
            };

            if (classificationMap.TryGetValue(classificationLower, out var variants))
            {
                query = query.Where(t => t.Classifications.Any(c =>
                    variants.Any(v => c.Name.ToLower().Contains(v))));
            }
            else
            {
                // Fallback: direct match
                query = query.Where(t => t.Classifications.Any(c =>
                    c.Name.ToLower().Contains(classificationLower)));
            }
        }

        if (date.HasValue)
        {
            var latestCreatedOnUtc = new DateTimeOffset(
                date.Value.ToDateTime(TimeOnly.MaxValue),
                TimeSpan.Zero);
            query = query.Where(t => t.CreatedOnUtc <= latestCreatedOnUtc);
        }

        if (people.HasValue)
        {
            var requiredPeople = people.Value;
            query = query.Where(t => t.Classifications.Any(c =>
                c.Plans.Any(p =>
                    p.Activities.Any(a =>
                        a.Accommodation != null &&
                        a.Accommodation.RoomCapacity >= requiredPeople))));
        }

        if (minPrice.HasValue || maxPrice.HasValue || minDays.HasValue || maxDays.HasValue)
        {
            query = query.Where(t => t.Classifications.Any(c =>
                (!minPrice.HasValue || c.BasePrice >= minPrice.Value) &&
                (!maxPrice.HasValue || c.BasePrice <= maxPrice.Value) &&
                (!minDays.HasValue || c.NumberOfDay >= minDays.Value) &&
                (!maxDays.HasValue || c.NumberOfDay <= maxDays.Value)));
        }

        return query;
    }

    public async Task<List<(string City, string Country, int ToursCount)>> GetTrendingDestinations(int limit, CancellationToken cancellationToken = default)
    {
        var locations = await _context.TourPlanLocations
            .Where(l => l.City != null && l.Country != null)
            .Where(l => l.TourDayActivity != null && l.TourDayActivity.TourDay != null &&
                        l.TourDayActivity.TourDay.Classification != null &&
                        l.TourDayActivity.TourDay.Classification.Tour != null &&
                        l.TourDayActivity.TourDay.Classification.Tour.Status == TourStatus.Active &&
                        !l.TourDayActivity.TourDay.Classification.Tour.IsDeleted)
            .GroupBy(l => new { l.City, l.Country })
            .Select(g => new { g.Key.City, g.Key.Country, ToursCount = g.Select(l => l.TourDayActivity!.TourDay!.Classification!.Tour!.Id).Distinct().Count() })
            .OrderByDescending(x => x.ToursCount)
            .Take(limit)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return locations.Select(l => (l.City!, l.Country!, l.ToursCount)).ToList();
    }

    public async Task<List<TourPlanLocationEntity>> GetTopAttractions(int limit, CancellationToken cancellationToken = default)
    {
        var attractionTypes = new[] { LocationType.TouristAttraction, LocationType.Museum, LocationType.NationalPark, LocationType.Beach, LocationType.Temple };

        return await _context.TourPlanLocations
            .AsNoTracking()
            .Where(l => Enumerable.Contains(attractionTypes, l.LocationType))
            .Where(l => l.City != null && l.Country != null)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> GetTotalActiveTours(CancellationToken cancellationToken = default)
    {
        return await _context.Tours
            .Where(t => t.Status == TourStatus.Active && !t.IsDeleted)
            .CountAsync(cancellationToken);
    }

    public async Task<decimal> GetTotalDistanceKm(CancellationToken cancellationToken = default)
    {
        return await _context.TourDayActivities
            .Where(a => a.DistanceKm != null)
            .Where(a => a.TourDay != null &&
                        a.TourDay.Classification != null &&
                        a.TourDay.Classification.Tour != null &&
                        a.TourDay.Classification.Tour.Status == TourStatus.Active &&
                        !a.TourDay.Classification.Tour.IsDeleted)
            .SumAsync(a => (decimal?)a.DistanceKm, cancellationToken) ?? 0;
    }

    public async Task<List<string>> GetAllDestinations(CancellationToken cancellationToken = default)
    {
        return await _context.TourPlanLocations
            .Where(l => l.City != null)
            .Where(l => l.TourDayActivity != null && l.TourDayActivity.TourDay != null &&
                        l.TourDayActivity.TourDay.Classification != null &&
                        l.TourDayActivity.TourDay.Classification.Tour != null &&
                        l.TourDayActivity.TourDay.Classification.Tour.Status == TourStatus.Active &&
                        !l.TourDayActivity.TourDay.Classification.Tour.IsDeleted)
            .Select(l => l.City!)
            .Distinct()
            .OrderBy(c => c)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<TourPlanLocationEntity?> FindLocationByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.TourPlanLocations
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
    }
}
