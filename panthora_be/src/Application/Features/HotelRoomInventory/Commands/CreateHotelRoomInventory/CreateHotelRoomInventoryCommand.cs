namespace Application.Features.HotelRoomInventory.Commands.CreateHotelRoomInventory;

using Application.Features.HotelRoomInventory.DTOs;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record CreateHotelRoomInventoryCommand(
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("roomType")] RoomType RoomType,
    [property: JsonPropertyName("totalRooms")] int TotalRooms) : ICommand<ErrorOr<HotelRoomInventoryDto>>;