namespace Application.Features.Admin.DTOs;

using Domain.Enums;
using System.Text.Json.Serialization;

public sealed record TransportProviderListItemDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("phoneNumber")] string? PhoneNumber,
    [property: JsonPropertyName("avatarUrl")] string? AvatarUrl,
    [property: JsonPropertyName("status")] UserStatus Status,
    [property: JsonPropertyName("vehicleCount")] int VehicleCount,
    [property: JsonPropertyName("continents")] List<string> Continents,
    [property: JsonPropertyName("primaryContinent")] string? PrimaryContinent,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("bookingCount")] int BookingCount);
