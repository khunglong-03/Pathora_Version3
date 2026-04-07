namespace Application.Features.TransportProvider.Vehicles.DTOs;

public sealed record VehicleResponseDto(
    Guid Id,
    string VehiclePlate,
    string VehicleType,
    string? Brand,
    string? Model,
    int SeatCapacity,
    string? LocationArea,
    string? OperatingCountries,
    List<string>? VehicleImageUrls,
    bool IsActive,
    string? Notes,
    DateTimeOffset CreatedOnUtc
);

public sealed record CreateVehicleRequestDto(
    string VehiclePlate,
    int VehicleType,
    string? Brand,
    string? Model,
    int SeatCapacity,
    int? LocationArea,
    string? OperatingCountries,
    List<string>? VehicleImageUrls,
    string? Notes
);

public sealed record UpdateVehicleRequestDto(
    int VehicleType,
    string? Brand,
    string? Model,
    int? SeatCapacity,
    int? LocationArea,
    string? OperatingCountries,
    List<string>? VehicleImageUrls,
    string? Notes
);
