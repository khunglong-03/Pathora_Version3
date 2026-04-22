namespace Application.Features.HotelServiceProvider.Accommodations.DTOs;

using System.Text.Json.Serialization;
using Domain.Enums;

public sealed record AccommodationDto(
    Guid Id,
    Guid SupplierId,
    string RoomType,
    int TotalRooms,
    string? Name,
    string? Address,
    string? LocationArea,
    string? OperatingCountries,
    List<string>? ImageUrls,
    string? Notes);

public sealed record CreateAccommodationRequestDto(
    [property: JsonConverter(typeof(JsonStringEnumConverter))]
    RoomType RoomType,
    int TotalRooms,
    string? Name,
    string? Address,
    int? LocationArea,
    string? OperatingCountries,
    List<string>? ImageUrls,
    string? Notes);

public sealed record UpdateAccommodationRequestDto(
    [property: JsonConverter(typeof(JsonStringEnumConverter))]
    RoomType? RoomType,
    int? TotalRooms,
    string? Name,
    string? Address,
    int? LocationArea,
    string? OperatingCountries,
    List<string>? ImageUrls,
    string? Notes);
