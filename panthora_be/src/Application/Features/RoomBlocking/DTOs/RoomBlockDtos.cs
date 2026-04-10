namespace Application.Features.RoomBlocking.DTOs;

using Domain.Enums;

public sealed record RoomBlockDto(
    Guid Id,
    Guid SupplierId,
    string? SupplierName,
    RoomType RoomType,
    Guid? BookingAccommodationDetailId,
    Guid? BookingId,
    DateOnly BlockedDate,
    int RoomCountBlocked,
    DateTimeOffset CreatedOnUtc);

public sealed record CreateRoomBlockRequestDto(
    Guid SupplierId,
    RoomType RoomType,
    Guid? BookingAccommodationDetailId,
    Guid? BookingId,
    DateOnly BlockedDate,
    int RoomCountBlocked);

public sealed record UpdateRoomBlockRequestDto(
    int RoomCountBlocked);
