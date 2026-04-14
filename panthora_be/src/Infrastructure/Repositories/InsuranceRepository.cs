using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class InsuranceRepository(AppDbContext context)
    : Repository<TourInsuranceEntity>(context), IInsuranceRepository
{
    public async Task<IReadOnlyList<TourInsuranceEntity>> GetByClassificationIdAsync(Guid classificationId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(x => x.TourClassificationId == classificationId && !x.IsDeleted)
            .OrderBy(x => x.InsuranceName)
            .ToListAsync(cancellationToken);
    }
}
