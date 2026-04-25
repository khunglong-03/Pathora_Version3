using System.Text.Json.Serialization;

namespace Application.Features.TransportProvider.Vehicles.DTOs;
public sealed record VehicleResponseDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("vehicleType")] string VehicleType,
    [property: JsonPropertyName("brand")] string? Brand,
    [property: JsonPropertyName("model")] string? Model,
    [property: JsonPropertyName("seatCapacity")] int SeatCapacity,
    [property: JsonPropertyName("quantity")] int Quantity,
    [property: JsonPropertyName("locationArea")] string? LocationArea,
    [property: JsonPropertyName("operatingCountries")] string? OperatingCountries,
    [property: JsonPropertyName("vehicleImageUrls")] List<string>? VehicleImageUrls,
    [property: JsonPropertyName("isActive")] bool IsActive,
    [property: JsonPropertyName("isDeleted")] bool IsDeleted,
    [property: JsonPropertyName("notes")] string? Notes,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc
);

public sealed record CreateVehicleRequestDto(
    [property: JsonPropertyName("vehicleType")] int VehicleType,
    [property: JsonPropertyName("brand")] string? Brand,
    [property: JsonPropertyName("model")] string? Model,
    [property: JsonPropertyName("seatCapacity")] int SeatCapacity,
    [property: JsonPropertyName("locationArea")] int? LocationArea,
    [property: JsonPropertyName("operatingCountries")] string? OperatingCountries,
    [property: JsonPropertyName("vehicleImageUrls")] List<string>? VehicleImageUrls,
    [property: JsonPropertyName("notes")] string? Notes,
    [property: JsonPropertyName("quantity")] int Quantity = 1
);

public sealed record UpdateVehicleRequestDto(
    [property: JsonPropertyName("vehicleType")] int VehicleType,
    [property: JsonPropertyName("brand")] string? Brand,
    [property: JsonPropertyName("model")] string? Model,
    [property: JsonPropertyName("seatCapacity")] int? SeatCapacity,
    [property: JsonPropertyName("quantity")] int? Quantity,
    [property: JsonPropertyName("locationArea")] int? LocationArea,
    [property: JsonPropertyName("operatingCountries")] string? OperatingCountries,
    [property: JsonPropertyName("vehicleImageUrls")] List<string>? VehicleImageUrls,
    [property: JsonPropertyName("notes")] string? Notes
);
