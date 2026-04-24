namespace Application.Features.RoomBlocking.Commands.CreateRoomBlock;

using Application.Features.RoomBlocking.DTOs;
using BuildingBlocks.CORS;
using Domain.Enums;
using ErrorOr;
using System.Text.Json.Serialization;

public sealed record CreateRoomBlockCommand(
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("roomType")] RoomType RoomType,
    [property: JsonPropertyName("bookingAccommodationDetailId")] Guid? BookingAccommodationDetailId,
    [property: JsonPropertyName("bookingId")] Guid? BookingId,
    [property: JsonPropertyName("blockedDate")] DateOnly BlockedDate,
    [property: JsonPropertyName("roomCountBlocked")] int RoomCountBlocked) : ICommand<ErrorOr<RoomBlockDto>>;
