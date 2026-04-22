namespace Domain.Common.Repositories;

using Domain.Entities;
using Domain.Enums;

public interface IRoomBlockRepository : IRepository<RoomBlockEntity>
{
    Task<RoomBlockEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RoomBlockEntity>> GetByDateRangeAsync(Guid supplierId, RoomType roomType, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RoomBlockEntity>> GetByBookingAccommodationDetailIdAsync(Guid bookingAccommodationDetailId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RoomBlockEntity>> GetBySupplierAsync(Guid supplierId, CancellationToken cancellationToken = default);
    Task AddRangeAsync(IEnumerable<RoomBlockEntity> entities, CancellationToken cancellationToken = default);
    void Remove(RoomBlockEntity entity);
    void Add(RoomBlockEntity entity);
    void Update(RoomBlockEntity entity);
    Task DeleteByBookingAccommodationDetailIdAsync(Guid bookingAccommodationDetailId, CancellationToken cancellationToken = default);
    Task<int> GetBlockedRoomCountAsync(Guid supplierId, RoomType roomType, DateOnly date, HoldStatus? holdStatus = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RoomBlockEntity>> GetByTourInstanceDayActivityIdAsync(Guid tourInstanceDayActivityId, CancellationToken cancellationToken = default);
    Task DeleteByTourInstanceDayActivityIdAsync(Guid tourInstanceDayActivityId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RoomBlockEntity>> GetByTourInstanceDayActivityIdsAsync(IEnumerable<Guid> tourInstanceDayActivityIds, CancellationToken cancellationToken = default);
}
