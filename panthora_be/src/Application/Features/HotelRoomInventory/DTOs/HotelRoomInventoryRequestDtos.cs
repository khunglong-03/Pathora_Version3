namespace Application.Features.HotelRoomInventory.DTOs;

using Domain.Enums;

public sealed record CreateHotelRoomInventoryRequestDto(
    Guid SupplierId,
    RoomType RoomType,
    int TotalRooms);

public sealed record UpdateHotelRoomInventoryRequestDto(int TotalRooms);
