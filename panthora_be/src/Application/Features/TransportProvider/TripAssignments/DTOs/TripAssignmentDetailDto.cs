namespace Application.Features.TransportProvider.TripAssignments.DTOs;

public sealed record TripAssignmentDetailDto(
    Guid Id,
    string BookingReference,
    string Route,
    DateTimeOffset? TripDate,
    string? VehiclePlate,
    string? VehicleType,
    int? VehicleCapacity,
    string? DriverName,
    string? DriverPhone,
    string? DriverLicense,
    string Status,
    string StatusText,
    string? RejectionReason,
    string? Notes,
    DateTimeOffset CreatedOnUtc
);
