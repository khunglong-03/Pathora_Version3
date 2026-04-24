using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record AssignVehicleToRouteResponseDto(
    [property: JsonPropertyName("success")] bool Success,
    [property: JsonPropertyName("seatCapacityWarning")] bool SeatCapacityWarning,
    [property: JsonPropertyName("vehicleSeatCapacity")] int? VehicleSeatCapacity,
    [property: JsonPropertyName("tourMaxParticipation")] int? TourMaxParticipation);
