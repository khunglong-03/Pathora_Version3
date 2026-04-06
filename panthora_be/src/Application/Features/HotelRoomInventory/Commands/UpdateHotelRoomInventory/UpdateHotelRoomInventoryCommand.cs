namespace Application.Features.HotelRoomInventory.Commands.UpdateHotelRoomInventory;

using Application.Features.HotelRoomInventory.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;

public sealed record UpdateHotelRoomInventoryCommand(
    Guid Id,
    int TotalRooms
) : ICommand<ErrorOr<HotelRoomInventoryDto>>;