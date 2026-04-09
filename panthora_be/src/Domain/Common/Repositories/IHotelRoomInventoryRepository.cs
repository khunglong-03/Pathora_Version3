namespace Domain.Common.Repositories;

using Domain.Entities;
using Domain.Enums;

public interface IHotelRoomInventoryRepository
{
    Task<HotelRoomInventoryEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<HotelRoomInventoryEntity?> FindByHotelAndRoomTypeAsync(Guid supplierId, RoomType roomType, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<HotelRoomInventoryEntity>> GetByHotelAsync(Guid supplierId, CancellationToken cancellationToken = default);
    Task AddAsync(HotelRoomInventoryEntity entity, CancellationToken cancellationToken = default);
    void Update(HotelRoomInventoryEntity entity);
    void Remove(HotelRoomInventoryEntity entity);
}
