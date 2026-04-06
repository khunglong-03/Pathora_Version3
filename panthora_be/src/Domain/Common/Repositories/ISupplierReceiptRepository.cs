using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ISupplierReceiptRepository : IRepository<SupplierReceiptEntity>
{
    Task<IReadOnlyList<SupplierReceiptEntity>> GetBySupplierPayableIdAsync(Guid supplierPayableId);
}
