using System.Text.Json.Serialization;

namespace Application.Features.TransportProvider.Drivers.DTOs;
public record DriverActivityResponseDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("bookingActivityReservationId")] Guid BookingActivityReservationId,
    [property: JsonPropertyName("bookingTitle")] string BookingTitle,
    [property: JsonPropertyName("bookingNote")] string? BookingNote,
    [property: JsonPropertyName("tourDayActivityId")] Guid TourDayActivityId,
    [property: JsonPropertyName("activityTitle")] string ActivityTitle,
    [property: JsonPropertyName("activityDescription")] string? ActivityDescription,
    [property: JsonPropertyName("startTime")] DateTimeOffset? StartTime,
    [property: JsonPropertyName("endTime")] DateTimeOffset? EndTime,
    [property: JsonPropertyName("fromLocation")] string? FromLocation,
    [property: JsonPropertyName("toLocation")] string? ToLocation,
    [property: JsonPropertyName("status")] int? Status,
    [property: JsonPropertyName("rejectionReason")] string? RejectionReason,
    [property: JsonPropertyName("updatedAt")] DateTimeOffset UpdatedAt,
    [property: JsonPropertyName("vehiclePlate")] string? VehiclePlate,
    [property: JsonPropertyName("vehicleType")] string? VehicleType
);
