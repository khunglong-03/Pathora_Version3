namespace Domain.Common.Repositories;

using Domain.Entities;
using Domain.Enums;

public interface IRoomBlockRepository : IRepository<RoomBlockEntity>
{
    Task<RoomBlockEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RoomBlockEntity>> GetByDateRangeAsync(Guid supplierId, RoomType roomType, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RoomBlockEntity>> GetByBookingAccommodationDetailIdAsync(Guid bookingAccommodationDetailId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RoomBlockEntity>> GetBySupplierAsync(Guid supplierId, CancellationToken cancellationToken = default);
    void Remove(RoomBlockEntity entity);
    void Add(RoomBlockEntity entity);
    Task DeleteByBookingAccommodationDetailIdAsync(Guid bookingAccommodationDetailId, CancellationToken cancellationToken = default);
    Task<int> GetBlockedRoomCountAsync(Guid supplierId, RoomType roomType, DateOnly date, HoldStatus? holdStatus = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RoomBlockEntity>> GetByTourInstanceDayActivityIdAsync(Guid tourInstanceDayActivityId, CancellationToken cancellationToken = default);
    Task DeleteByTourInstanceDayActivityIdAsync(Guid tourInstanceDayActivityId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RoomBlockEntity>> GetByTourInstanceDayActivityIdsAsync(IEnumerable<Guid> tourInstanceDayActivityIds, CancellationToken cancellationToken = default);
    /// <summary>
    /// Deletes every <see cref="RoomBlockEntity"/> whose <c>TourInstanceDayActivity</c> belongs to
    /// the given tour instance. Used by tour cancel / delete cleanup (ER-3).
    /// </summary>
    Task DeleteByTourInstanceAsync(Guid tourInstanceId, CancellationToken cancellationToken = default);
}
