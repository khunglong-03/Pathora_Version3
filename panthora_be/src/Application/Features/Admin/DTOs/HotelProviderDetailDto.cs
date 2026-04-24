namespace Application.Features.Admin.DTOs;

using Domain.Enums;
using System.Text.Json.Serialization;

public sealed record HotelProviderDetailDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("supplierName")] string SupplierName,
    [property: JsonPropertyName("supplierCode")] string SupplierCode,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("phone")] string? Phone,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("avatarUrl")] string? AvatarUrl,
    [property: JsonPropertyName("status")] UserStatus Status,
    [property: JsonPropertyName("ownerUserId")] Guid? OwnerUserId,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset? CreatedOnUtc,
    [property: JsonPropertyName("primaryContinent")] string? PrimaryContinent,
    [property: JsonPropertyName("continents")] List<string> Continents,
    [property: JsonPropertyName("properties")] List<HotelPropertySummaryDto> Properties,
    [property: JsonPropertyName("accommodations")] List<HotelAccommodationSummaryDto> Accommodations,
    [property: JsonPropertyName("roomOptions")] List<HotelProviderRoomOptionDto> RoomOptions,
    [property: JsonPropertyName("accommodationCount")] int AccommodationCount,
    [property: JsonPropertyName("propertyCount")] int PropertyCount,
    [property: JsonPropertyName("totalRooms")] int TotalRooms,
    [property: JsonPropertyName("bookingCount")] int BookingCount,
    [property: JsonPropertyName("activeBookingCount")] int ActiveBookingCount,
    [property: JsonPropertyName("completedBookingCount")] int CompletedBookingCount);

public sealed record HotelPropertySummaryDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("supplierCode")] string SupplierCode,
    [property: JsonPropertyName("supplierName")] string SupplierName,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("phone")] string? Phone,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("primaryContinent")] string? PrimaryContinent,
    [property: JsonPropertyName("continents")] List<string> Continents,
    [property: JsonPropertyName("accommodationCount")] int AccommodationCount,
    [property: JsonPropertyName("totalRooms")] int TotalRooms);

public sealed record HotelAccommodationSummaryDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("supplierName")] string SupplierName,
    [property: JsonPropertyName("roomType")] string RoomType,
    [property: JsonPropertyName("totalRooms")] int TotalRooms,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("locationArea")] string? LocationArea);

public sealed record HotelProviderRoomOptionDto(
    [property: JsonPropertyName("roomType")] string RoomType,
    [property: JsonPropertyName("label")] string Label,
    [property: JsonPropertyName("totalRooms")] int TotalRooms);
