namespace Application.Dtos;

public sealed record TourInstanceDayDto(
    Guid Id,
    int InstanceDayNumber,
    DateTimeOffset ActualDate,
    string Title,
    string? Description,
    TimeOnly? StartTime,
    TimeOnly? EndTime,
    string? Note,
    List<TourInstanceDayActivityDto> Activities);

/// <summary>One approved (or planned) vehicle row on a transportation activity.</summary>
public sealed record TourInstanceTransportAssignmentDto(
    Guid Id,
    Guid VehicleId,
    Guid? DriverId,
    int? SeatCountSnapshot,
    string? VehiclePlate,
    string? VehicleType,
    string? VehicleBrand,
    string? VehicleModel,
    int? VehicleSeatCapacity,
    string? DriverName,
    string? DriverPhone);

public sealed record TourInstanceDayActivityDto(
    Guid Id,
    int Order,
    string ActivityType,
    string Title,
    string? Description,
    TimeOnly? StartTime,
    TimeOnly? EndTime,
    bool IsOptional,
    string? Note,
    TourInstancePlanAccommodationDto? Accommodation,

    // Transportation Plan info
    string? TransportationType,
    string? TransportationName,
    TourPlanLocationDto? FromLocation,
    TourPlanLocationDto? ToLocation,
    int? DurationMinutes,
    decimal? DistanceKm,
    decimal? Price,
    string? BookingReference,

    // Transport Plan fields (per-activity, analogous to PlanAccommodation for Hotel)
    string? RequestedVehicleType,
    int? RequestedSeatCount,
    /// <summary>Scope addendum 2026-04-23 — manager-requested vehicle count (nullable for legacy).</summary>
    int? RequestedVehicleCount,
    Guid? TransportSupplierId,
    string? TransportSupplierName,
    string? TransportationApprovalStatus,
    string? TransportationApprovalNote,

    // Instance-specific Vehicle Assignment info
    Guid? VehicleId,
    string? VehiclePlate,
    string? VehicleType,
    string? VehicleBrand,
    string? VehicleModel,
    int? SeatCapacity,
    Guid? DriverId,
    string? DriverName,
    string? DriverPhone,
    string? PickupLocation,
    string? DropoffLocation,
    DateTimeOffset? DepartureTime,
    DateTimeOffset? ArrivalTime,
    /// <summary>Concrete vehicles for this leg (multi-vehicle). Empty when none; legacy <see cref="VehicleId"/> may still mirror the first row.</summary>
    List<TourInstanceTransportAssignmentDto> TransportAssignments);

public sealed record TourInstancePlanAccommodationDto(
    Guid Id,
    string RoomType,
    int Quantity,
    Guid? SupplierId = null,
    string? SupplierName = null,
    string? SupplierApprovalStatus = null,
    string? SupplierApprovalNote = null,
    int RoomBlocksTotal = 0);
