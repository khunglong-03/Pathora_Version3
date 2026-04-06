namespace Application.Features.TransportProvider.Drivers.DTOs;

public sealed record DriverResponseDto(
    Guid Id,
    string FullName,
    string LicenseNumber,
    string LicenseType,
    string PhoneNumber,
    string? AvatarUrl,
    bool IsActive,
    string? Notes,
    DateTimeOffset CreatedOnUtc
);

public sealed record CreateDriverRequestDto(
    string FullName,
    string LicenseNumber,
    int LicenseType,
    string PhoneNumber,
    string? AvatarUrl,
    string? Notes
);

public sealed record UpdateDriverRequestDto(
    string? FullName,
    string? LicenseNumber,
    int? LicenseType,
    string? PhoneNumber,
    string? AvatarUrl,
    string? Notes
);
