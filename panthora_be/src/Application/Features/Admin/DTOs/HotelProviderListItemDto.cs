namespace Application.Features.Admin.DTOs;

using Domain.Enums;

public sealed record HotelProviderListItemDto(
    Guid Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    string? AvatarUrl,
    UserStatus Status,
    int AccommodationCount
);
