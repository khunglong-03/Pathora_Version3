using System.Text.Json.Serialization;

namespace Application.Features.TransportProvider.Revenue.DTOs;

public sealed record TripHistoryItemDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("bookingReference")] string BookingReference,
    [property: JsonPropertyName("routeName")] string RouteName,
    [property: JsonPropertyName("completedDate")] DateTimeOffset CompletedDate,
    [property: JsonPropertyName("vehicleType")] string VehicleType,
    [property: JsonPropertyName("driverName")] string DriverName,
    [property: JsonPropertyName("revenue")] long Revenue
)
{
    /// <summary>
    /// Maps to the route's TransportationName when available, falls back to transportation type name.
    /// </summary>
    public static string ResolveRouteName(string? transportationName, string? transportationType) =>
        !string.IsNullOrWhiteSpace(transportationName)
            ? transportationName
            : transportationType ?? "Unknown Route";
}