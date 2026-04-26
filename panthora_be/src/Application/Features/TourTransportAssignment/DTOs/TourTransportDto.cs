using System.Text.Json.Serialization;

namespace Application.Features.TourTransportAssignment.DTOs;

public sealed record RouteTransportAssignmentRequestDto(
    [property: JsonPropertyName("bookingActivityReservationId")] Guid BookingActivityReservationId,
    [property: JsonPropertyName("tourDayActivityId")] Guid TourDayActivityId,
    [property: JsonPropertyName("driverId")] Guid? DriverId,
    [property: JsonPropertyName("vehicleId")] Guid? VehicleId);

public sealed record TransportInfoDto(
    [property: JsonPropertyName("tourDayActivityId")] Guid TourDayActivityId,
    [property: JsonPropertyName("routeOrder")] int RouteOrder,
    [property: JsonPropertyName("driver")] DriverInfoDto? Driver,
    [property: JsonPropertyName("vehicle")] VehicleInfoDto? Vehicle);

public sealed record DriverInfoDto(
    [property: JsonPropertyName("fullName")] string FullName,
    [property: JsonPropertyName("phoneNumber")] string PhoneNumber,
    [property: JsonPropertyName("maskedLicenseNumber")] string MaskedLicenseNumber);

public sealed record VehicleInfoDto(
    [property: JsonPropertyName("vehicleType")] string VehicleType,
    [property: JsonPropertyName("brand")] string? Brand,
    [property: JsonPropertyName("model")] string? Model,
    [property: JsonPropertyName("seatCapacity")] int SeatCapacity);

public sealed record BookingTransportInfoDto(
    [property: JsonPropertyName("bookingId")] Guid BookingId,
    [property: JsonPropertyName("routes")] List<TransportInfoDto> Routes);
