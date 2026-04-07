using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IVehicleRepository : IRepository<VehicleEntity>
{
    Task<List<VehicleEntity>> FindAllByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default);
    Task<List<VehicleEntity>> FindAllByOwnerIdAsync(Guid ownerId, Domain.Enums.Continent? locationArea, CancellationToken cancellationToken = default);
    Task<VehicleEntity?> FindByPlateAsync(string plate, CancellationToken cancellationToken = default);
    Task<VehicleEntity?> FindByPlateAndOwnerIdAsync(string plate, Guid ownerId, CancellationToken cancellationToken = default);
    Task<bool> ExistsByPlateAsync(string plate, CancellationToken cancellationToken = default);
    Task<bool> ExistsByPlateAndOwnerIdAsync(string plate, Guid ownerId, CancellationToken cancellationToken = default);
    Task<List<VehicleEntity>> FindAllAsync(string? searchText, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<int> CountAllAsync(string? searchText, CancellationToken cancellationToken = default);
    Task SoftDeleteAsync(Guid id, string performedBy, CancellationToken cancellationToken = default);
    Task<List<Guid>> FindOwnerIdsWithVehicleInContinentAsync(Domain.Enums.Continent continent, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, (int Count, List<Domain.Enums.Continent> Continents)>> GetVehicleDataGroupedByOwnerAsync(
        List<Guid> ownerIds, CancellationToken cancellationToken = default);
}