namespace Application.Features.RoomBlocking.DTOs;

using Domain.Enums;

public sealed record HotelRoomAvailabilityDto(
    DateOnly Date,
    RoomType RoomType,
    int TotalRooms,
    int BlockedRooms,
    int AvailableRooms);
