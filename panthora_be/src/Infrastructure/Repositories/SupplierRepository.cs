using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SupplierRepository : Repository<SupplierEntity>, ISupplierRepository
{
    public SupplierRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<SupplierEntity?> GetByCodeAsync(string supplierCode, CancellationToken cancellationToken = default)
    {
        return await _context.Suppliers.FirstOrDefaultAsync(s => s.SupplierCode == supplierCode, cancellationToken);
    }

    public async Task<SupplierEntity?> FindByOwnerUserIdAsync(Guid ownerUserId, CancellationToken cancellationToken = default)
    {
        return await _context.Suppliers
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.OwnerUserId == ownerUserId && !s.IsDeleted, cancellationToken);
    }

    public async Task<List<SupplierEntity>> FindAllTransportProvidersAsync(CancellationToken cancellationToken)
    {
        return await _context.Suppliers
            .AsNoTracking()
            .Where(s => !s.IsDeleted && s.IsActive && s.SupplierType == SupplierType.Transport)
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SupplierEntity>> FindAllHotelProvidersAsync(CancellationToken cancellationToken)
    {
        return await _context.Suppliers
            .AsNoTracking()
            .Where(s => !s.IsDeleted && s.IsActive && s.SupplierType == SupplierType.Accommodation)
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountActiveTransportProvidersAsync(CancellationToken cancellationToken)
    {
        return await _context.Suppliers
            .AsNoTracking()
            .CountAsync(s => !s.IsDeleted && s.IsActive && s.SupplierType == SupplierType.Transport, cancellationToken);
    }

    public async Task<int> CountActiveHotelProvidersAsync(CancellationToken cancellationToken)
    {
        return await _context.Suppliers
            .AsNoTracking()
            .CountAsync(s => !s.IsDeleted && s.IsActive && s.SupplierType == SupplierType.Accommodation, cancellationToken);
    }

    public async Task<List<Guid>> FindOwnerUserIdsWithAccommodationInContinentAsync(
        Continent continent, CancellationToken cancellationToken = default)
    {
        return await _context.Suppliers
            .AsNoTracking()
            .Where(s => !s.IsDeleted && s.OwnerUserId.HasValue && s.SupplierType == SupplierType.Accommodation)
            .Where(s => _context.HotelRoomInventories.Any(h => h.SupplierId == s.Id && h.LocationArea == continent))
            .Select(s => s.OwnerUserId!.Value)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    public async Task<Dictionary<Guid, (int Count, List<Continent> Continents)>> GetAccommodationDataGroupedByOwnerAsync(
        List<Guid> ownerUserIds, CancellationToken cancellationToken = default)
    {
        if (ownerUserIds.Count == 0)
            return [];

        var supplierIds = await _context.Suppliers
            .AsNoTracking()
            .Where(s => !s.IsDeleted && s.OwnerUserId.HasValue && ownerUserIds.Contains(s.OwnerUserId.Value))
            .Select(s => new { s.OwnerUserId, s.Id })
            .ToListAsync(cancellationToken);

        var groups = await _context.HotelRoomInventories
            .AsNoTracking()
            .Where(h => supplierIds.Select(s => s.Id).Contains(h.SupplierId))
            .GroupBy(h => h.SupplierId)
            .Select(g => new
            {
                SupplierId = g.Key,
                Count = g.Count(),
                Continents = g.Where(h => h.LocationArea.HasValue).Select(h => h.LocationArea!.Value).Distinct().ToList()
            })
            .ToListAsync(cancellationToken);

        var result = new Dictionary<Guid, (int Count, List<Continent> Continents)>();
        foreach (var group in groups)
        {
            var ownerUserId = supplierIds.First(s => s.Id == group.SupplierId).OwnerUserId!.Value;
            result[ownerUserId] = (group.Count, group.Continents);
        }

        return result;
    }

    public async Task<Dictionary<Guid, string>> GetTransportSupplierAddressByOwnerAsync(
        List<Guid> ownerUserIds, CancellationToken cancellationToken = default)
    {
        if (ownerUserIds.Count == 0)
            return [];

        var suppliers = await _context.Suppliers
            .AsNoTracking()
            .Where(s => !s.IsDeleted && s.SupplierType == SupplierType.Transport && s.OwnerUserId.HasValue && ownerUserIds.Contains(s.OwnerUserId.Value))
            .Select(s => new { s.OwnerUserId, s.Address })
            .ToListAsync(cancellationToken);

        return suppliers
            .Where(s => s.OwnerUserId.HasValue && !string.IsNullOrEmpty(s.Address))
            .ToDictionary(s => s.OwnerUserId!.Value, s => s.Address!);
    }

    public async Task<List<Guid>> GetTransportSupplierIdsByOwnerAsync(Guid ownerUserId, CancellationToken cancellationToken = default)
    {
        return await _context.Suppliers
            .AsNoTracking()
            .Where(s => !s.IsDeleted && s.SupplierType == SupplierType.Transport && s.OwnerUserId == ownerUserId)
            .Select(s => s.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<(int Total, int Active, int Completed)> GetTransportBookingCountsByOwnerAsync(
        Guid ownerUserId, CancellationToken cancellationToken = default)
    {
        var supplierIds = await GetTransportSupplierIdsByOwnerAsync(ownerUserId, cancellationToken);

        if (supplierIds.Count == 0)
            return (0, 0, 0);

        var details = await _context.BookingTransportDetails
            .AsNoTracking()
            .Where(b => b.SupplierId.HasValue && supplierIds.Contains(b.SupplierId.Value))
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Active = g.Count(b => b.Status != ReservationStatus.Completed && b.Status != ReservationStatus.Cancelled),
                Completed = g.Count(b => b.Status == ReservationStatus.Completed)
            })
            .FirstOrDefaultAsync(cancellationToken);

        return details is null
            ? (0, 0, 0)
            : (details.Total, details.Active, details.Completed);
    }
}