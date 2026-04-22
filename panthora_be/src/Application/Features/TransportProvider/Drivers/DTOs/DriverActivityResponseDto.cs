namespace Application.Features.TransportProvider.Drivers.DTOs;

public record DriverActivityResponseDto(
    Guid Id,
    Guid BookingActivityReservationId,
    string BookingTitle,
    string? BookingNote,
    Guid TourDayActivityId,
    string ActivityTitle,
    string? ActivityDescription,
    DateTimeOffset? StartTime,
    DateTimeOffset? EndTime,
    string? FromLocation,
    string? ToLocation,
    int? Status,
    string? RejectionReason,
    DateTimeOffset UpdatedAt,
    string? VehiclePlate,
    string? VehicleType
);
