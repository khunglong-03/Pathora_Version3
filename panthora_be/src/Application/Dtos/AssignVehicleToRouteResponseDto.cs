namespace Application.Dtos;

public sealed record AssignVehicleToRouteResponseDto(
    bool Success,
    bool SeatCapacityWarning,
    int? VehicleSeatCapacity,
    int? TourMaxParticipation);
