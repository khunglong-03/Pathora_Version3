using Domain.Entities;
using Domain.Enums;

namespace Domain.Common.Repositories;

public sealed record HotelProviderAdminData(
    Guid SupplierId,
    string SupplierCode,
    string SupplierName,
    string? Address,
    string? Phone,
    string? Email,
    DateTimeOffset? CreatedOnUtc,
    Continent? PrimaryContinent,
    int PropertyCount,
    int RoomCount,
    List<Continent> Continents);

public interface ISupplierRepository : IRepository<SupplierEntity>
{
    Task<SupplierEntity?> GetByCodeAsync(string supplierCode, CancellationToken cancellationToken = default);
    /// <summary>
    /// Returns the first supplier owned by the user.
    /// Migration bridge only: prefer FindAllByOwnerUserIdAsync for multi-hotel support.
    /// </summary>
    [Obsolete("Migration bridge only. Prefer FindAllByOwnerUserIdAsync(Guid ownerUserId, CancellationToken) for multi-hotel owner flows.")]
    Task<SupplierEntity?> FindByOwnerUserIdAsync(Guid ownerUserId, CancellationToken cancellationToken = default);
    Task<List<SupplierEntity>> FindAllByOwnerUserIdAsync(Guid ownerUserId, CancellationToken cancellationToken = default);
    Task<List<SupplierEntity>> FindAllTransportProvidersAsync(CancellationToken cancellationToken);
    Task<List<SupplierEntity>> FindAllHotelProvidersAsync(CancellationToken cancellationToken);
    Task<int> CountActiveTransportProvidersAsync(CancellationToken cancellationToken);
    Task<int> CountActiveHotelProvidersAsync(CancellationToken cancellationToken);
    Task<List<Guid>> FindOwnerUserIdsWithAccommodationInContinentAsync(
        Domain.Enums.Continent continent, CancellationToken cancellationToken = default);
    Task<List<Guid>> FindOwnerUserIdsWithAccommodationsInContinentsAsync(
        List<Domain.Enums.Continent> continents, CancellationToken cancellationToken = default);
    Task<List<Guid>> FindOwnerUserIdsByHotelProviderContinentsAsync(
        List<Continent> continents, CancellationToken cancellationToken = default);
    Task<List<Guid>> FindOwnerUserIdsByTransportProviderContinentsAsync(
        List<Continent> continents, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, (int Count, List<Domain.Enums.Continent> Continents)>> GetAccommodationDataGroupedByOwnerAsync(
        List<Guid> ownerUserIds, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, List<HotelProviderAdminData>>> GetHotelProviderAdminDataGroupedByOwnerAsync(
        List<Guid> ownerUserIds, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, (string? Address, Continent? PrimaryContinent)>> GetTransportSupplierAddressByOwnerAsync(
        List<Guid> ownerUserIds, CancellationToken cancellationToken = default);
    Task<List<Guid>> GetTransportSupplierIdsByOwnerAsync(Guid ownerUserId, CancellationToken cancellationToken = default);
    Task<(int Total, int Active, int Completed)> GetTransportBookingCountsByOwnerAsync(Guid ownerUserId, CancellationToken cancellationToken = default);
    Task<(int Total, int Active, int Completed)> GetHotelBookingCountsByOwnerAsync(Guid ownerUserId, CancellationToken cancellationToken = default);
}
