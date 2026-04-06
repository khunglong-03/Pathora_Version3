using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ISupplierRepository : IRepository<SupplierEntity>
{
    Task<SupplierEntity?> GetByCodeAsync(string supplierCode);
    Task<List<SupplierEntity>> FindAllTransportProvidersAsync(CancellationToken cancellationToken);
    Task<List<SupplierEntity>> FindAllHotelProvidersAsync(CancellationToken cancellationToken);
    Task<int> CountActiveTransportProvidersAsync(CancellationToken cancellationToken);
    Task<int> CountActiveHotelProvidersAsync(CancellationToken cancellationToken);
}
