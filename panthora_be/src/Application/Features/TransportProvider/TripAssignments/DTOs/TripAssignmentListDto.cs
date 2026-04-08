namespace Application.Features.TransportProvider.TripAssignments.DTOs;

public sealed record TripAssignmentListDto(
    Guid Id,
    string BookingReference,
    string Route,
    DateTimeOffset? TripDate,
    string? VehiclePlate,
    string? DriverName,
    string Status,
    string StatusText
);
