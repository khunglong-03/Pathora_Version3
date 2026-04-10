namespace Application.Features.Admin.DTOs;

using Domain.Enums;

public sealed record TransportProviderDetailDto(
    Guid Id,
    string SupplierName,
    string SupplierCode,
    string? Address,
    string? Phone,
    string? Email,
    string? AvatarUrl,
    UserStatus Status,
    DateTimeOffset? UserCreatedAt,
    List<VehicleSummaryDto> Vehicles,
    List<DriverSummaryDto> Drivers,
    int BookingCount,
    int ActiveBookingCount,
    int CompletedBookingCount
);

public sealed record VehicleSummaryDto(
    Guid Id,
    string VehiclePlate,
    string VehicleType,
    string? Brand,
    string? Model,
    int SeatCapacity,
    string? LocationArea,
    bool IsActive,
    DateTimeOffset CreatedAt
);

public sealed record DriverSummaryDto(
    Guid Id,
    string FullName,
    string LicenseNumber,
    string LicenseType,
    string PhoneNumber,
    bool IsActive
);
