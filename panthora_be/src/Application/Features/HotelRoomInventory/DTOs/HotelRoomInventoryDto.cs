using Application.Dtos;
using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Features.HotelRoomInventory.DTOs;

public sealed record HotelRoomInventoryDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("supplierName")] string? SupplierName,
    [property: JsonPropertyName("roomType")] RoomType RoomType,
    [property: JsonPropertyName("totalRooms")] int TotalRooms,
    [property: JsonPropertyName("name")] string? Name = null,
    [property: JsonPropertyName("address")] string? Address = null,
    [property: JsonPropertyName("locationArea")] string? LocationArea = null,
    [property: JsonPropertyName("operatingCountries")] string? OperatingCountries = null,
    [property: JsonPropertyName("thumbnail")] ImageDto? Thumbnail = null,
    [property: JsonPropertyName("images")] List<ImageDto>? Images = null,
    [property: JsonPropertyName("notes")] string? Notes = null);