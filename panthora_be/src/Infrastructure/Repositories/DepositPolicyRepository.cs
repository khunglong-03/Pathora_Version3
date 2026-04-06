using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class DepositPolicyRepository(AppDbContext context) : Repository<DepositPolicyEntity>(context), IDepositPolicyRepository
{
    public async Task<IReadOnlyList<DepositPolicyEntity>> GetAllActiveAsync()
    {
        return await _dbSet
            .Where(x => x.IsActive && !x.IsDeleted)
            .OrderBy(x => x.TourScope)
            .ToListAsync();
    }
}
