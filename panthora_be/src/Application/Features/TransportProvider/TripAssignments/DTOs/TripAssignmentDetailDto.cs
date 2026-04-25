using System.Text.Json.Serialization;

namespace Application.Features.TransportProvider.TripAssignments.DTOs;
public sealed record TripAssignmentDetailDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("bookingReference")] string BookingReference,
    [property: JsonPropertyName("route")] string Route,
    [property: JsonPropertyName("tripDate")] DateTimeOffset? TripDate,
    [property: JsonPropertyName("vehicleType")] string? VehicleType,
    [property: JsonPropertyName("vehicleCapacity")] int? VehicleCapacity,
    [property: JsonPropertyName("driverName")] string? DriverName,
    [property: JsonPropertyName("driverPhone")] string? DriverPhone,
    [property: JsonPropertyName("driverLicense")] string? DriverLicense,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("statusText")] string StatusText,
    [property: JsonPropertyName("rejectionReason")] string? RejectionReason,
    [property: JsonPropertyName("notes")] string? Notes,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc
);
