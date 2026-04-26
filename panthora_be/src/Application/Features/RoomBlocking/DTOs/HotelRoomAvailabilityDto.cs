using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Features.RoomBlocking.DTOs;

public sealed record HotelRoomAvailabilityDto(
    [property: JsonPropertyName("date")] DateOnly Date,
    [property: JsonPropertyName("roomType")] RoomType RoomType,
    [property: JsonPropertyName("totalRooms")] int TotalRooms,
    [property: JsonPropertyName("blockedRooms")] int BlockedRooms,
    [property: JsonPropertyName("availableRooms")] int AvailableRooms);
