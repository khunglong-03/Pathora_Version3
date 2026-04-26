using System.Text.Json.Serialization;

namespace Application.Features.TransportProvider.Drivers.DTOs;

public sealed record DriverResponseDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("licenseNumber")] string LicenseNumber,
    [property: JsonPropertyName("licenseType")] string LicenseType,
    [property: JsonPropertyName("phoneNumber")] string PhoneNumber,
    [property: JsonPropertyName("avatarUrl")] string? AvatarUrl,
    [property: JsonPropertyName("isActive")] bool IsActive,
    [property: JsonPropertyName("notes")] string? Notes,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc
);

public sealed record CreateDriverRequestDto(
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("licenseNumber")] string LicenseNumber,
    [property: JsonPropertyName("licenseType")] int LicenseType,
    [property: JsonPropertyName("phoneNumber")] string PhoneNumber,
    [property: JsonPropertyName("avatarUrl")] string? AvatarUrl,
    [property: JsonPropertyName("notes")] string? Notes
);

public sealed record UpdateDriverRequestDto(
    [property: JsonPropertyName("fullName")] string? FullName,
    [property: JsonPropertyName("licenseNumber")] string? LicenseNumber,
    [property: JsonPropertyName("licenseType")] int? LicenseType,
    [property: JsonPropertyName("phoneNumber")] string? PhoneNumber,
    [property: JsonPropertyName("avatarUrl")] string? AvatarUrl,
    [property: JsonPropertyName("notes")] string? Notes
);
