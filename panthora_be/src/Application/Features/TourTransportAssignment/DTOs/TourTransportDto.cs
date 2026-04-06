namespace Application.Features.TourTransportAssignment.DTOs;

public sealed record RouteTransportAssignmentRequestDto(
    Guid BookingActivityReservationId,
    Guid TourPlanRouteId,
    Guid? DriverId,
    Guid? VehicleId
);

public sealed record TransportInfoDto(
    Guid TourPlanRouteId,
    int RouteOrder,
    DriverInfoDto? Driver,
    VehicleInfoDto? Vehicle
);

public sealed record DriverInfoDto(
    string FullName,
    string PhoneNumber,
    string MaskedLicenseNumber
);

public sealed record VehicleInfoDto(
    string VehiclePlate,
    string VehicleType,
    string? Brand,
    string? Model,
    int SeatCapacity
);

public sealed record BookingTransportInfoDto(
    Guid BookingId,
    List<TransportInfoDto> Routes
);
