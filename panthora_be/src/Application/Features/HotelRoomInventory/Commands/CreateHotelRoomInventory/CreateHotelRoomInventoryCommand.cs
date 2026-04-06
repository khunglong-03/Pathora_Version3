namespace Application.Features.HotelRoomInventory.Commands.CreateHotelRoomInventory;

using Application.Features.HotelRoomInventory.DTOs;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;

public sealed record CreateHotelRoomInventoryCommand(
    Guid SupplierId,
    RoomType RoomType,
    int TotalRooms
) : ICommand<ErrorOr<HotelRoomInventoryDto>>;