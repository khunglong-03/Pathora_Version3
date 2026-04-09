namespace Domain.Common.Repositories;

using Domain.Entities;
using Domain.Enums;

public interface IRoomBlockRepository
{
    Task<RoomBlockEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RoomBlockEntity>> GetByDateRangeAsync(Guid supplierId, RoomType roomType, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RoomBlockEntity>> GetByBookingAccommodationDetailIdAsync(Guid bookingAccommodationDetailId, CancellationToken cancellationToken = default);
    Task AddRangeAsync(IEnumerable<RoomBlockEntity> entities, CancellationToken cancellationToken = default);
    void Update(RoomBlockEntity entity);
    Task DeleteByBookingAccommodationDetailIdAsync(Guid bookingAccommodationDetailId, CancellationToken cancellationToken = default);
    Task<int> GetBlockedRoomCountAsync(Guid supplierId, RoomType roomType, DateOnly date, CancellationToken cancellationToken = default);
}
