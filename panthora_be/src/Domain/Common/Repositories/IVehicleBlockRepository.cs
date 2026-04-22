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
}
