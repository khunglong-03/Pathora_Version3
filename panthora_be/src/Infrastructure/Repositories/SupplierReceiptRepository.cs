using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SupplierReceiptRepository(AppDbContext context)
    : Repository<SupplierReceiptEntity>(context), ISupplierReceiptRepository
{
    public async Task<IReadOnlyList<SupplierReceiptEntity>> GetBySupplierPayableIdAsync(Guid supplierPayableId)
    {
        return await _dbSet
            .Where(x => x.SupplierPayableId == supplierPayableId)
            .OrderByDescending(x => x.PaidAt)
            .ToListAsync();
    }
}
