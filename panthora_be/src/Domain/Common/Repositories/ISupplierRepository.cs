using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ISupplierRepository : IRepository<SupplierEntity>
{
    Task<SupplierEntity?> GetByCodeAsync(string supplierCode, CancellationToken cancellationToken = default);
    Task<SupplierEntity?> FindByOwnerUserIdAsync(Guid ownerUserId, CancellationToken cancellationToken = default);
    Task<List<SupplierEntity>> FindAllTransportProvidersAsync(CancellationToken cancellationToken);
    Task<List<SupplierEntity>> FindAllHotelProvidersAsync(CancellationToken cancellationToken);
    Task<int> CountActiveTransportProvidersAsync(CancellationToken cancellationToken);
    Task<int> CountActiveHotelProvidersAsync(CancellationToken cancellationToken);
    Task<List<Guid>> FindOwnerUserIdsWithAccommodationInContinentAsync(
        Domain.Enums.Continent continent, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, (int Count, List<Domain.Enums.Continent> Continents)>> GetAccommodationDataGroupedByOwnerAsync(
        List<Guid> ownerUserIds, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, string>> GetTransportSupplierAddressByOwnerAsync(
        List<Guid> ownerUserIds, CancellationToken cancellationToken = default);
    Task<List<Guid>> GetTransportSupplierIdsByOwnerAsync(Guid ownerUserId, CancellationToken cancellationToken = default);
    Task<(int Total, int Active, int Completed)> GetTransportBookingCountsByOwnerAsync(Guid ownerUserId, CancellationToken cancellationToken = default);
}
