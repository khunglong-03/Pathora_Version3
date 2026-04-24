namespace Application.Features.HotelRoomInventory.Commands.UpdateHotelRoomInventory;

using Application.Features.HotelRoomInventory.DTOs;
using BuildingBlocks.CORS;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record UpdateHotelRoomInventoryCommand(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("totalRooms")] int TotalRooms) : ICommand<ErrorOr<HotelRoomInventoryDto>>;