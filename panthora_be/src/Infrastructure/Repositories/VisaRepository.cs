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
}
