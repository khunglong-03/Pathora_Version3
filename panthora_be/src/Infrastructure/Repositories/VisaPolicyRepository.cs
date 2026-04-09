using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class VisaPolicyRepository(AppDbContext context) : Repository<VisaPolicyEntity>(context), IVisaPolicyRepository
{
    public async Task<IReadOnlyList<VisaPolicyEntity>> GetActivePoliciesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => x.IsActive && !x.IsDeleted)
            .OrderBy(x => x.Region)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<VisaPolicyEntity>> GetAllPoliciesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Region)
            .ToListAsync(cancellationToken);
    }

    public async Task<VisaPolicyEntity?> GetByRegionAsync(string region, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(x => x.Region == region && x.IsActive && !x.IsDeleted, cancellationToken);
    }
}