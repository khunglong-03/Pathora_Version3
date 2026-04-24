using System.Text.Json.Serialization;

namespace Application.Features.TransportProvider.TripAssignments.DTOs;

public sealed record TripAssignmentListDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("bookingReference")] string BookingReference,
    [property: JsonPropertyName("route")] string Route,
    [property: JsonPropertyName("tripDate")] DateTimeOffset? TripDate,
    [property: JsonPropertyName("vehiclePlate")] string? VehiclePlate,
    [property: JsonPropertyName("driverName")] string? DriverName,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("statusText")] string StatusText
);
