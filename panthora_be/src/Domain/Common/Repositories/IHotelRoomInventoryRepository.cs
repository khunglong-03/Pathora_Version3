namespace Domain.Common.Repositories;

using Domain.Entities;
using Domain.Enums;

public interface IHotelRoomInventoryRepository
{
    Task<HotelRoomInventoryEntity?> FindByIdAsync(Guid id);
    Task<HotelRoomInventoryEntity?> FindByHotelAndRoomTypeAsync(Guid supplierId, RoomType roomType);
    Task<IReadOnlyList<HotelRoomInventoryEntity>> GetByHotelAsync(Guid supplierId);
    Task AddAsync(HotelRoomInventoryEntity entity);
    void Update(HotelRoomInventoryEntity entity);
    void Remove(HotelRoomInventoryEntity entity);
}
