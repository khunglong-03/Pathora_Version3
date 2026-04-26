namespace Domain.Common.Repositories;

using Domain.Entities;
using Domain.Enums;

public interface IVehicleBlockRepository : IRepository<VehicleBlockEntity>
{
    Task<VehicleBlockEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<VehicleBlockEntity>> FindActiveBlocksAsync(Guid vehicleId, DateOnly date, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<VehicleBlockEntity>> GetByActivityIdAsync(Guid tourInstanceDayActivityId, CancellationToken cancellationToken = default);
    void Remove(VehicleBlockEntity entity);
    Task DeleteByActivityAsync(Guid tourInstanceDayActivityId, CancellationToken cancellationToken = default);
    Task DeleteByTourInstanceAsync(Guid tourInstanceId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns vehicle blocks for the given date range scoped to the owner's suppliers.
    /// Includes Vehicle + TourInstanceDayActivity navigation for schedule display.
    /// </summary>
    Task<List<VehicleScheduleProjection>> GetByOwnerAndDateRangeAsync(
        IReadOnlyCollection<Guid> ownedSupplierIds,
        Guid ownerUserId,
        DateOnly fromDate,
        DateOnly toDate,
        Guid? vehicleId,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Projection for vehicle schedule display (avoids loading full entity graphs).
/// </summary>
public sealed record VehicleScheduleProjection(
    Guid BlockId,
    Guid VehicleId,
    Domain.Enums.VehicleType VehicleType,
    string? VehicleBrand,
    string? VehicleModel,
    int SeatCapacity,
    DateOnly BlockedDate,
    Domain.Enums.HoldStatus HoldStatus,
    string? TourInstanceName,
    string? TourInstanceCode,
    string? ActivityTitle,
    string? FromLocationName,
    string? ToLocationName);
