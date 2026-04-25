using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Features.Admin.DTOs;
public sealed record HotelProviderListItemDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("supplierName")] string SupplierName,
    [property: JsonPropertyName("supplierCode")] string SupplierCode,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("phoneNumber")] string? PhoneNumber,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("avatarUrl")] string? AvatarUrl,
    [property: JsonPropertyName("status")] UserStatus Status,
    [property: JsonPropertyName("ownerUserId")] Guid OwnerUserId,
    [property: JsonPropertyName("accommodationCount")] int AccommodationCount,
    [property: JsonPropertyName("propertyCount")] int PropertyCount,
    [property: JsonPropertyName("roomCount")] int RoomCount,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset? CreatedOnUtc,
    [property: JsonPropertyName("primaryContinent")] string? PrimaryContinent,
    [property: JsonPropertyName("continents")] List<string> Continents);
