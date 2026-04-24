namespace Application.Features.HotelRoomInventory.Commands.DeleteHotelRoomInventory;

using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record DeleteHotelRoomInventoryCommand([property: JsonPropertyName("id")] Guid Id) : ICommand<ErrorOr<Success>>;