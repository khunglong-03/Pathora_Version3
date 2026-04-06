using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ISupplierPayableRepository : IRepository<SupplierPayableEntity>
{
    Task<IReadOnlyList<SupplierPayableEntity>> GetByBookingIdAsync(Guid bookingId);
}
