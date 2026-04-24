namespace Application.Features.HotelServiceProvider.Accommodations.DTOs;

using System.Text.Json.Serialization;
using Domain.Enums;

public sealed record AccommodationDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("supplierId")] Guid SupplierId,
    [property: JsonPropertyName("roomType")] string RoomType,
    [property: JsonPropertyName("totalRooms")] int TotalRooms,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("locationArea")] string? LocationArea,
    [property: JsonPropertyName("operatingCountries")] string? OperatingCountries,
    [property: JsonPropertyName("imageUrls")] List<string>? ImageUrls,
    [property: JsonPropertyName("notes")] string? Notes);

public sealed record CreateAccommodationRequestDto(
    [property: JsonPropertyName("roomType")]
    [property: JsonConverter(typeof(JsonStringEnumConverter))]
    RoomType RoomType,
    [property: JsonPropertyName("totalRooms")] int TotalRooms,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("locationArea")] int? LocationArea,
    [property: JsonPropertyName("operatingCountries")] string? OperatingCountries,
    [property: JsonPropertyName("imageUrls")] List<string>? ImageUrls,
    [property: JsonPropertyName("notes")] string? Notes);

public sealed record UpdateAccommodationRequestDto(
    [property: JsonPropertyName("roomType")]
    [property: JsonConverter(typeof(JsonStringEnumConverter))]
    RoomType? RoomType,
    [property: JsonPropertyName("totalRooms")] int? TotalRooms,
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("locationArea")] int? LocationArea,
    [property: JsonPropertyName("operatingCountries")] string? OperatingCountries,
    [property: JsonPropertyName("imageUrls")] List<string>? ImageUrls,
    [property: JsonPropertyName("notes")] string? Notes);
