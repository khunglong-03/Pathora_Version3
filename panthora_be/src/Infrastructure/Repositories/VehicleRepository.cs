using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class VehicleRepository(AppDbContext context) : Repository<VehicleEntity>(context), IVehicleRepository
{
    public async Task<List<VehicleEntity>> FindAllByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default)
    {
        return await _context.Vehicles
            .AsNoTracking()
            .Where(v => v.OwnerId == ownerId && !v.IsDeleted)
            .OrderByDescending(v => v.CreatedOnUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<VehicleEntity>> FindAllByOwnerIdAsync(Guid ownerId, Continent? locationArea, CancellationToken cancellationToken = default)
    {
        var query = _context.Vehicles
            .AsNoTracking()
            .Where(v => v.OwnerId == ownerId && !v.IsDeleted);

        if (locationArea.HasValue)
            query = query.Where(v => v.LocationArea == locationArea.Value);

        return await query
            .OrderByDescending(v => v.CreatedOnUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<VehicleEntity>> FindAllByOwnerIdPaginatedAsync(Guid ownerId, int pageNumber, int pageSize, bool? isActive, Continent? locationArea, bool? isDeleted = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Vehicles
            .AsNoTracking()
            .Where(v => v.OwnerId == ownerId);

        if (isDeleted.HasValue)
            query = query.Where(v => v.IsDeleted == isDeleted.Value);

        if (isActive.HasValue)
            query = query.Where(v => v.IsActive == isActive.Value);
            
        if (locationArea.HasValue)
            query = query.Where(v => v.LocationArea == locationArea.Value);

        return await query
            .OrderByDescending(v => v.CreatedOnUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountAllByOwnerIdAsync(Guid ownerId, bool? isActive, Continent? locationArea, bool? isDeleted = false, CancellationToken cancellationToken = default)
    {
        var query = _context.Vehicles
            .AsNoTracking()
            .Where(v => v.OwnerId == ownerId);

        if (isDeleted.HasValue)
            query = query.Where(v => v.IsDeleted == isDeleted.Value);

        if (isActive.HasValue)
            query = query.Where(v => v.IsActive == isActive.Value);

        if (locationArea.HasValue)
            query = query.Where(v => v.LocationArea == locationArea.Value);

        return await query.CountAsync(cancellationToken);
    }

    public async Task<List<VehicleEntity>> FindAllAsync(string? searchText, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _context.Vehicles
            .AsNoTracking()
            .Include(v => v.Owner)
            .Where(v => !v.IsDeleted);

        if (!string.IsNullOrWhiteSpace(searchText))
        {
            var search = searchText.ToLower();
            query = query.Where(v =>
                (v.Brand != null && v.Brand.ToLower().Contains(search)) ||
                (v.Model != null && v.Model.ToLower().Contains(search)));
        }

        return await query
            .OrderByDescending(v => v.CreatedOnUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountAllAsync(string? searchText, CancellationToken cancellationToken = default)
    {
        var query = _context.Vehicles
            .Where(v => !v.IsDeleted);

        if (!string.IsNullOrWhiteSpace(searchText))
        {
            var search = searchText.ToLower();
            query = query.Where(v =>
                (v.Brand != null && v.Brand.ToLower().Contains(search)) ||
                (v.Model != null && v.Model.ToLower().Contains(search)));
        }

        return await query.CountAsync(cancellationToken);
    }

    public async Task SoftDeleteAsync(Guid id, string performedBy, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
        if (vehicle != null)
        {
            vehicle.SoftDelete(performedBy);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<List<Guid>> FindOwnerIdsWithVehicleInContinentAsync(
        Continent continent, CancellationToken cancellationToken = default)
    {
        return await _context.Vehicles
            .AsNoTracking()
            .Where(v => v.LocationArea == continent && !v.IsDeleted)
            .Select(v => v.OwnerId)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Guid>> FindOwnerIdsWithVehiclesInContinentsAsync(
        List<Continent> continents, CancellationToken cancellationToken = default)
    {
        return await _context.Vehicles
            .AsNoTracking()
            .Where(v => v.LocationArea.HasValue && continents.Contains(v.LocationArea.Value) && !v.IsDeleted)
            .Select(v => v.OwnerId)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    public async Task<Dictionary<Guid, (int Count, List<Continent> Continents)>> GetVehicleDataGroupedByOwnerAsync(
        List<Guid> ownerIds, CancellationToken cancellationToken = default)
    {
        if (ownerIds.Count == 0)
            return [];

        var groups = await _context.Vehicles
            .AsNoTracking()
            .Where(v => ownerIds.Contains(v.OwnerId) && !v.IsDeleted)
            .GroupBy(v => v.OwnerId)
            .Select(g => new
            {
                OwnerId = g.Key,
                Count = g.Count(),
                Continents = g.Where(v => v.LocationArea.HasValue).Select(v => v.LocationArea!.Value).Distinct().ToList()
            })
            .ToListAsync(cancellationToken);

        return groups.ToDictionary(
            g => g.OwnerId,
            g => (g.Count, g.Continents));
    }

    public async Task<HashSet<Guid>> FindActiveIdsByOwnerAsync(
        IEnumerable<Guid> vehicleIds, Guid ownerId, CancellationToken cancellationToken = default)
    {
        var ids = vehicleIds.ToList();
        if (ids.Count == 0)
            return [];

        var matched = await _context.Vehicles
            .AsNoTracking()
            .Where(v => ids.Contains(v.Id) && v.OwnerId == ownerId && v.IsActive && !v.IsDeleted)
            .Select(v => v.Id)
            .ToListAsync(cancellationToken);

        return [.. matched];
    }

    public Task<int> CountActiveByOwnerAndTypeAsync(
        Guid ownerId, Domain.Enums.VehicleType vehicleType, CancellationToken cancellationToken = default)
    {
        return _context.Vehicles
            .AsNoTracking()
            .Where(v => v.OwnerId == ownerId && v.VehicleType == vehicleType && v.IsActive && !v.IsDeleted)
            .SumAsync(v => (int)v.Quantity, cancellationToken);
    }

    public Task<int> CountActiveByTransportSupplierFleetAsync(
        Guid transportSupplierId,
        Guid? fleetOwnerUserId,
        VehicleType vehicleType,
        CancellationToken cancellationToken = default)
    {
        return _context.Vehicles
            .AsNoTracking()
            .Where(v => !v.IsDeleted
                     && v.IsActive
                     && v.VehicleType == vehicleType
                     && (
                         v.SupplierId == transportSupplierId
                         || (v.SupplierId == null && fleetOwnerUserId.HasValue && v.OwnerId == fleetOwnerUserId.Value)))
            .SumAsync(v => (int)v.Quantity, cancellationToken);
    }

    public async Task DeactivateAllByOwnerAsync(Guid ownerId, string performedBy, CancellationToken cancellationToken = default)
    {
        await _context.Vehicles
            .Where(v => v.OwnerId == ownerId && v.IsActive && !v.IsDeleted)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(v => v.IsActive, false)
                .SetProperty(v => v.LastModifiedBy, performedBy)
                .SetProperty(v => v.LastModifiedOnUtc, DateTimeOffset.UtcNow),
                cancellationToken);
    }
}
