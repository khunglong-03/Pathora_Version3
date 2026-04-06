namespace Application.Features.HotelRoomInventory.DTOs;

using Domain.Enums;

public sealed record HotelRoomInventoryDto(
    Guid Id,
    Guid SupplierId,
    string? SupplierName,
    RoomType RoomType,
    int TotalRooms);