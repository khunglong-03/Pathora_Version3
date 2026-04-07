namespace Application.Features.HotelServiceProvider.Accommodations.DTOs;

using Domain.Enums;

public sealed record AccommodationDto(
    Guid Id,
    Guid SupplierId,
    RoomType RoomType,
    int TotalRooms,
    string? Name,
    string? Address,
    string? LocationArea,
    string? OperatingCountries,
    string? ImageUrls,
    string? Notes);

public sealed record CreateAccommodationRequestDto(
    RoomType RoomType,
    int TotalRooms,
    string? Name,
    string? Address,
    int? LocationArea,
    string? OperatingCountries,
    List<string>? ImageUrls,
    string? Notes);

public sealed record UpdateAccommodationRequestDto(
    RoomType? RoomType,
    int? TotalRooms,
    string? Name,
    string? Address,
    int? LocationArea,
    string? OperatingCountries,
    List<string>? ImageUrls,
    string? Notes);
