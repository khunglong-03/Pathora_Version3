namespace Application.Features.Admin.DTOs;

using Domain.Enums;

public sealed record HotelProviderDetailDto(
    Guid Id,
    string SupplierName,
    string SupplierCode,
    string? Address,
    string? Phone,
    string? Email,
    string? AvatarUrl,
    UserStatus Status,
    Guid? OwnerUserId,
    DateTimeOffset? CreatedOnUtc,
    string? PrimaryContinent,
    List<string> Continents,
    List<HotelPropertySummaryDto> Properties,
    List<HotelAccommodationSummaryDto> Accommodations,
    List<HotelProviderRoomOptionDto> RoomOptions,
    int AccommodationCount,
    int PropertyCount,
    int TotalRooms,
    int BookingCount,
    int ActiveBookingCount,
    int CompletedBookingCount);

public sealed record HotelPropertySummaryDto(
    Guid Id,
    string SupplierCode,
    string SupplierName,
    string? Address,
    string? Phone,
    string? Email,
    string? PrimaryContinent,
    List<string> Continents,
    int AccommodationCount,
    int TotalRooms);

public sealed record HotelAccommodationSummaryDto(
    Guid Id,
    Guid SupplierId,
    string SupplierName,
    string RoomType,
    int TotalRooms,
    string? Name,
    string? LocationArea);

public sealed record HotelProviderRoomOptionDto(
    string RoomType,
    string Label,
    int TotalRooms);
