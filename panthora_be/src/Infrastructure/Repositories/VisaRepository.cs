using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class VisaRepository(AppDbContext context) : Repository<VisaEntity>(context), IVisaRepository
{
    public async Task<VisaEntity?> GetByVisaApplicationIdAsync(Guid visaApplicationId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(x => x.VisaApplicationId == visaApplicationId, cancellationToken);
    }

    public async Task<Dictionary<Guid, VisaEntity>> GetByVisaApplicationIdsAsync(IEnumerable<Guid> visaApplicationIds, CancellationToken cancellationToken = default)
    {
        var ids = visaApplicationIds.ToList();
        if (ids.Count == 0)
            return [];

        var visas = await _dbSet
            .AsNoTracking()
            .Where(v => ids.Contains(v.VisaApplicationId))
            .ToListAsync(cancellationToken);

        return visas.ToDictionary(v => v.VisaApplicationId);
    }
}
