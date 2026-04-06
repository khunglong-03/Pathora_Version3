using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SupplierRepository(AppDbContext context) : Repository<SupplierEntity>(context), ISupplierRepository
{
    public async Task<SupplierEntity?> GetByCodeAsync(string supplierCode)
    {
        return await _dbSet.FirstOrDefaultAsync(s => s.SupplierCode == supplierCode);
    }

    public async Task<List<SupplierEntity>> FindAllTransportProvidersAsync(CancellationToken cancellationToken)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(s => !s.IsDeleted && s.IsActive && s.SupplierType == SupplierType.Transport)
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SupplierEntity>> FindAllHotelProvidersAsync(CancellationToken cancellationToken)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(s => !s.IsDeleted && s.IsActive && s.SupplierType == SupplierType.Accommodation)
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountActiveTransportProvidersAsync(CancellationToken cancellationToken)
    {
        return await _dbSet
            .AsNoTracking()
            .CountAsync(s => !s.IsDeleted && s.IsActive && s.SupplierType == SupplierType.Transport, cancellationToken);
    }

    public async Task<int> CountActiveHotelProvidersAsync(CancellationToken cancellationToken)
    {
        return await _dbSet
            .AsNoTracking()
            .CountAsync(s => !s.IsDeleted && s.IsActive && s.SupplierType == SupplierType.Accommodation, cancellationToken);
    }
}
