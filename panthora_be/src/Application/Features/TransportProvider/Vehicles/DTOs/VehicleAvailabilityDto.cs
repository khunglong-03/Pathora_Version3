using System.Text.Json.Serialization;

namespace Application.Features.TransportProvider.Vehicles.DTOs;

/// <summary>
/// Vehicle with real-time available quantity for a specific date.
/// Used by the approve form to show "Còn trống X/Y" per vehicle option.
/// </summary>
public sealed record AvailableVehicleDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("vehicleType")] string VehicleType,
    [property: JsonPropertyName("brand")] string? Brand,
    [property: JsonPropertyName("model")] string? Model,
    [property: JsonPropertyName("seatCapacity")] int SeatCapacity,
    [property: JsonPropertyName("quantity")] int Quantity,
    [property: JsonPropertyName("availableQuantity")] int AvailableQuantity,
    [property: JsonPropertyName("notes")] string? Notes);

/// <summary>
/// A single vehicle block entry for the schedule dashboard calendar.
/// </summary>
public sealed record VehicleScheduleItemDto(
    [property: JsonPropertyName("blockId")] Guid BlockId,
    [property: JsonPropertyName("vehicleId")] Guid VehicleId,
    [property: JsonPropertyName("vehicleType")] string VehicleType,
    [property: JsonPropertyName("vehicleBrand")] string? VehicleBrand,
    [property: JsonPropertyName("vehicleModel")] string? VehicleModel,
    [property: JsonPropertyName("seatCapacity")] int SeatCapacity,
    [property: JsonPropertyName("blockedDate")] DateOnly BlockedDate,
    [property: JsonPropertyName("holdStatus")] string HoldStatus,
    [property: JsonPropertyName("tourInstanceName")] string? TourInstanceName,
    [property: JsonPropertyName("tourInstanceCode")] string? TourInstanceCode,
    [property: JsonPropertyName("activityTitle")] string? ActivityTitle,
    [property: JsonPropertyName("fromLocationName")] string? FromLocationName,
    [property: JsonPropertyName("toLocationName")] string? ToLocationName);
