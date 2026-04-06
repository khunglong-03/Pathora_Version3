namespace Application.Features.HotelRoomInventory.Commands.DeleteHotelRoomInventory;

using BuildingBlocks.CORS;
using ErrorOr;

public sealed record DeleteHotelRoomInventoryCommand(Guid Id) : ICommand<ErrorOr<Success>>;