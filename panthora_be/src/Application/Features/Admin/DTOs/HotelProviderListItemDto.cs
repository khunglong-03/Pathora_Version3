namespace Application.Features.Admin.DTOs;

using Domain.Enums;

public sealed record HotelProviderListItemDto(
    Guid Id,
    string SupplierName,
    string SupplierCode,
    string Email,
    string? PhoneNumber,
    string? Address,
    string? AvatarUrl,
    UserStatus Status,
    int AccommodationCount,
    int PropertyCount,
    int RoomCount,
    DateTimeOffset? CreatedOnUtc,
    string? PrimaryContinent,
    List<string> Continents
);
