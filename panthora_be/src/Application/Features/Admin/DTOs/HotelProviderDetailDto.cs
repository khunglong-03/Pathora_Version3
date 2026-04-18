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
    DateTimeOffset? CreatedOnUtc,
    string? PrimaryContinent,
    List<string> Continents,
    List<HotelAccommodationSummaryDto> Accommodations,
    int AccommodationCount,
    int TotalRooms,
    int BookingCount,
    int ActiveBookingCount,
    int CompletedBookingCount);

public sealed record HotelAccommodationSummaryDto(
    Guid Id,
    string RoomType,
    int TotalRooms,
    string? Name,
    string? LocationArea);
