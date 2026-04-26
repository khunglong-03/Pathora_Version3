using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Features.Admin.DTOs;

public sealed record TransportProviderDetailDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("supplierName")] string SupplierName,
    [property: JsonPropertyName("supplierCode")] string SupplierCode,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("phone")] string? Phone,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("avatarUrl")] string? AvatarUrl,
    [property: JsonPropertyName("status")] UserStatus Status,
    [property: JsonPropertyName("ownerUserId")] Guid? OwnerUserId,
    [property: JsonPropertyName("userCreatedAt")] DateTimeOffset? UserCreatedAt,
    [property: JsonPropertyName("primaryContinent")] string? PrimaryContinent,
    [property: JsonPropertyName("continents")] List<string> Continents,
    [property: JsonPropertyName("vehicles")] List<VehicleSummaryDto> Vehicles,
    [property: JsonPropertyName("drivers")] List<DriverSummaryDto> Drivers,
    [property: JsonPropertyName("bookingCount")] int BookingCount,
    [property: JsonPropertyName("activeBookingCount")] int ActiveBookingCount,
    [property: JsonPropertyName("completedBookingCount")] int CompletedBookingCount);

public sealed record VehicleSummaryDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("vehicleType")] string VehicleType,
    [property: JsonPropertyName("brand")] string? Brand,
    [property: JsonPropertyName("model")] string? Model,
    [property: JsonPropertyName("seatCapacity")] int SeatCapacity,
    [property: JsonPropertyName("locationArea")] string? LocationArea,
    [property: JsonPropertyName("isActive")] bool IsActive,
    [property: JsonPropertyName("createdAt")] DateTimeOffset CreatedAt);

public sealed record DriverSummaryDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("licenseNumber")] string LicenseNumber,
    [property: JsonPropertyName("licenseType")] string LicenseType,
    [property: JsonPropertyName("phoneNumber")] string PhoneNumber,
    [property: JsonPropertyName("isActive")] bool IsActive);
