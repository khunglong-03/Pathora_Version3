namespace Application.Features.Admin.DTOs;

using Domain.Enums;

public sealed record TransportProviderListItemDto(
    Guid Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    string? AvatarUrl,
    UserStatus Status,
    int VehicleCount,
    List<string> Continents,
    string? Address,
    int BookingCount
);
