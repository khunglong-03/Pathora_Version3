using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class VisaPolicyRepository(AppDbContext context) : Repository<VisaPolicyEntity>(context), IVisaPolicyRepository
{
    public async Task<IReadOnlyList<VisaPolicyEntity>> GetActivePoliciesAsync()
    {
        return await _dbSet
            .Where(x => x.IsActive && !x.IsDeleted)
            .OrderBy(x => x.Region)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<VisaPolicyEntity>> GetAllPoliciesAsync()
    {
        return await _dbSet
            .Where(x => !x.IsDeleted)
            .OrderBy(x => x.Region)
            .ToListAsync();
    }

    public async Task<VisaPolicyEntity?> GetByRegionAsync(string region)
    {
        return await _dbSet
            .FirstOrDefaultAsync(x => x.Region == region && x.IsActive && !x.IsDeleted);
    }
}
