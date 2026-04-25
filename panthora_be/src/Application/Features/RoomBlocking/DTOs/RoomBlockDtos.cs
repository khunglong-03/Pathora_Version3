using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Features.RoomBlocking.DTOs;
public sealed record RoomBlockDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("supplierName")] string? SupplierName,
    [property: JsonPropertyName("roomType")] RoomType RoomType,
    [property: JsonPropertyName("bookingAccommodationDetailId")] Guid? BookingAccommodationDetailId,
    [property: JsonPropertyName("bookingId")] Guid? BookingId,
    [property: JsonPropertyName("blockedDate")] DateOnly BlockedDate,
    [property: JsonPropertyName("roomCountBlocked")] int RoomCountBlocked,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc);

public sealed record CreateRoomBlockRequestDto(
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("roomType")] RoomType RoomType,
    [property: JsonPropertyName("bookingAccommodationDetailId")] Guid? BookingAccommodationDetailId,
    [property: JsonPropertyName("bookingId")] Guid? BookingId,
    [property: JsonPropertyName("blockedDate")] DateOnly BlockedDate,
    [property: JsonPropertyName("roomCountBlocked")] int RoomCountBlocked);

public sealed record UpdateRoomBlockRequestDto(
    [property: JsonPropertyName("roomCountBlocked")] int RoomCountBlocked);
