namespace Domain.Common.Repositories;

using Domain.Entities;
using Domain.Enums;

public interface IRoomBlockRepository
{
    Task<RoomBlockEntity?> FindByIdAsync(Guid id);
    Task<IReadOnlyList<RoomBlockEntity>> GetByDateRangeAsync(Guid supplierId, RoomType roomType, DateOnly fromDate, DateOnly toDate);
    Task<IReadOnlyList<RoomBlockEntity>> GetByBookingAccommodationDetailIdAsync(Guid bookingAccommodationDetailId);
    Task AddRangeAsync(IEnumerable<RoomBlockEntity> entities);
    void Update(RoomBlockEntity entity);
    Task DeleteByBookingAccommodationDetailIdAsync(Guid bookingAccommodationDetailId);
    Task<int> GetBlockedRoomCountAsync(Guid supplierId, RoomType roomType, DateOnly date);
}
