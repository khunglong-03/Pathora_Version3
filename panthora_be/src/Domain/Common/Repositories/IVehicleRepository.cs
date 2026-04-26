using Domain.Entities;

namespace Domain.Common.Repositories;

public interface IVehicleRepository : IRepository<VehicleEntity>
{
    Task<List<VehicleEntity>> FindAllByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default);
    Task<List<VehicleEntity>> FindAllByOwnerIdAsync(Guid ownerId, Domain.Enums.Continent? locationArea, CancellationToken cancellationToken = default);
    Task<List<VehicleEntity>> FindAllByOwnerIdPaginatedAsync(Guid ownerId, int pageNumber, int pageSize, bool? isActive, Domain.Enums.Continent? locationArea, bool? isDeleted = false, CancellationToken cancellationToken = default);
    Task<int> CountAllByOwnerIdAsync(Guid ownerId, bool? isActive, Domain.Enums.Continent? locationArea, bool? isDeleted = false, CancellationToken cancellationToken = default);
    Task<List<VehicleEntity>> FindAllAsync(string? searchText, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<int> CountAllAsync(string? searchText, CancellationToken cancellationToken = default);
    Task SoftDeleteAsync(Guid id, string performedBy, CancellationToken cancellationToken = default);
    Task<List<Guid>> FindOwnerIdsWithVehicleInContinentAsync(Domain.Enums.Continent continent, CancellationToken cancellationToken = default);
    Task<List<Guid>> FindOwnerIdsWithVehiclesInContinentsAsync(List<Domain.Enums.Continent> continents, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, (int Count, List<Domain.Enums.Continent> Continents)>> GetVehicleDataGroupedByOwnerAsync(
        List<Guid> ownerIds, CancellationToken cancellationToken = default);
    /// <summary>
    /// Returns active, non-deleted vehicle IDs from <paramref name="vehicleIds"/>
    /// that belong to <paramref name="ownerId"/>.  Used for fleet ownership validation.
    /// </summary>
    Task<HashSet<Guid>> FindActiveIdsByOwnerAsync(
        IEnumerable<Guid> vehicleIds, Guid ownerId, CancellationToken cancellationToken = default);
    /// <summary>
    /// Count active, non-deleted vehicles owned by <paramref name="ownerId"/> that match
    /// <paramref name="vehicleType"/>. Used at tour-instance create time to guard
    /// <c>RequestedVehicleCount</c> against the supplier's fleet.
    /// </summary>
    Task<int> CountActiveByOwnerAndTypeAsync(
        Guid ownerId, Domain.Enums.VehicleType vehicleType, CancellationToken cancellationToken = default);

    /// <summary>
    /// Count active, non-deleted vehicles a transport supplier may assign: rows scoped to
    /// <paramref name="transportSupplierId"/> plus legacy rows with no <c>SupplierId</c> but
    /// owned by <paramref name="fleetOwnerUserId"/> (mirrors approve-time ownership checks).
    /// </summary>
    Task<int> CountActiveByTransportSupplierFleetAsync(
        Guid transportSupplierId,
        Guid? fleetOwnerUserId,
        Domain.Enums.VehicleType vehicleType,
        CancellationToken cancellationToken = default);

    Task DeactivateAllByOwnerAsync(Guid ownerId, string performedBy, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns vehicles owned by the supplier(s) that still have available capacity
    /// (<c>Quantity - activeBlockCount &gt; 0</c>) on <paramref name="date"/>.
    /// Each result carries <see cref="VehicleAvailabilityResult.AvailableQuantity"/>.
    /// </summary>
    Task<List<VehicleAvailabilityResult>> GetAvailableBySupplierAsync(
        IReadOnlyCollection<Guid> ownedSupplierIds,
        Guid ownerUserId,
        Domain.Enums.VehicleType? vehicleType,
        DateOnly date,
        Guid? excludeActivityId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Projection result for capacity-aware availability queries.
/// </summary>
public sealed record VehicleAvailabilityResult(
    Domain.Entities.VehicleEntity Vehicle,
    int AvailableQuantity);