using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Features.HotelRoomInventory.DTOs;

public sealed record CreateHotelRoomInventoryRequestDto(
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("roomType")] RoomType RoomType,
    [property: JsonPropertyName("totalRooms")] int TotalRooms);

public sealed record UpdateHotelRoomInventoryRequestDto(
    [property: JsonPropertyName("totalRooms")] int TotalRooms);
