namespace Application.Features.TransportProvider.Revenue.DTOs;

public sealed record TripHistoryItemDto(
    Guid Id,
    string BookingReference,
    string RouteName,
    DateTimeOffset CompletedDate,
    string VehiclePlate,
    string DriverName,
    long Revenue
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