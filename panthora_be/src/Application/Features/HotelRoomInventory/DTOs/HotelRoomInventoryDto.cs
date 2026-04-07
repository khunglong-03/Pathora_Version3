namespace Application.Features.HotelRoomInventory.DTOs;

using Domain.Enums;

public sealed record HotelRoomInventoryDto(
    Guid Id,
    Guid SupplierId,
    string? SupplierName,
    RoomType RoomType,
    int TotalRooms,
    string? Name = null,
    string? Address = null,
    string? LocationArea = null,
    string? OperatingCountries = null,
    string? ImageUrls = null,
    string? Notes = null);