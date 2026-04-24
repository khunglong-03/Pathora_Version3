using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record TourInstanceDayDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("instanceDayNumber")] int InstanceDayNumber,
    [property: JsonPropertyName("actualDate")] DateTimeOffset ActualDate,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("startTime")] TimeOnly? StartTime,
    [property: JsonPropertyName("endTime")] TimeOnly? EndTime,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("activities")] List<TourInstanceDayActivityDto> Activities);

/// <summary>One approved (or planned) vehicle row on a transportation activity.</summary>
public sealed record TourInstanceTransportAssignmentDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("vehicleId")] Guid VehicleId,
    [property: JsonPropertyName("driverId")] Guid? DriverId,
    [property: JsonPropertyName("seatCountSnapshot")] int? SeatCountSnapshot,
    [property: JsonPropertyName("vehiclePlate")] string? VehiclePlate,
    [property: JsonPropertyName("vehicleType")] string? VehicleType,
    [property: JsonPropertyName("vehicleBrand")] string? VehicleBrand,
    [property: JsonPropertyName("vehicleModel")] string? VehicleModel,
    [property: JsonPropertyName("vehicleSeatCapacity")] int? VehicleSeatCapacity,
    [property: JsonPropertyName("driverName")] string? DriverName,
    [property: JsonPropertyName("driverPhone")] string? DriverPhone);

public sealed record TourInstanceDayActivityDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("order")] int Order,
    [property: JsonPropertyName("activityType")] string ActivityType,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("startTime")] TimeOnly? StartTime,
    [property: JsonPropertyName("endTime")] TimeOnly? EndTime,
    [property: JsonPropertyName("isOptional")] bool IsOptional,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("accommodation")] TourInstancePlanAccommodationDto? Accommodation,

    // Transportation Plan info
    [property: JsonPropertyName("transportationType")] string? TransportationType,
    [property: JsonPropertyName("transportationName")] string? TransportationName,
    [property: JsonPropertyName("fromLocation")] TourPlanLocationDto? FromLocation,
    [property: JsonPropertyName("toLocation")] TourPlanLocationDto? ToLocation,
    [property: JsonPropertyName("durationMinutes")] int? DurationMinutes,
    [property: JsonPropertyName("distanceKm")] decimal? DistanceKm,
    [property: JsonPropertyName("price")] decimal? Price,
    [property: JsonPropertyName("bookingReference")] string? BookingReference,

    // Transport Plan fields (per-activity, analogous to PlanAccommodation for Hotel)
    [property: JsonPropertyName("requestedVehicleType")] string? RequestedVehicleType,
    [property: JsonPropertyName("requestedSeatCount")] int? RequestedSeatCount,
    /// <summary>Scope addendum 2026-04-23 — manager-requested vehicle count (nullable for legacy).</summary>
    [property: JsonPropertyName("requestedVehicleCount")] int? RequestedVehicleCount,
    [property: JsonPropertyName("transportSupplierId")] Guid? TransportSupplierId,
    [property: JsonPropertyName("transportSupplierName")] string? TransportSupplierName,
    [property: JsonPropertyName("transportationApprovalStatus")] string? TransportationApprovalStatus,
    [property: JsonPropertyName("transportationApprovalNote")] string? TransportationApprovalNote,

    // Instance-specific Vehicle Assignment info
    [property: JsonPropertyName("vehicleId")] Guid? VehicleId,
    [property: JsonPropertyName("vehiclePlate")] string? VehiclePlate,
    [property: JsonPropertyName("vehicleType")] string? VehicleType,
    [property: JsonPropertyName("vehicleBrand")] string? VehicleBrand,
    [property: JsonPropertyName("vehicleModel")] string? VehicleModel,
    [property: JsonPropertyName("seatCapacity")] int? SeatCapacity,
    [property: JsonPropertyName("driverId")] Guid? DriverId,
    [property: JsonPropertyName("driverName")] string? DriverName,
    [property: JsonPropertyName("driverPhone")] string? DriverPhone,
    [property: JsonPropertyName("pickupLocation")] string? PickupLocation,
    [property: JsonPropertyName("dropoffLocation")] string? DropoffLocation,
    [property: JsonPropertyName("departureTime")] DateTimeOffset? DepartureTime,
    [property: JsonPropertyName("arrivalTime")] DateTimeOffset? ArrivalTime,
    /// <summary>Concrete vehicles for this leg (multi-vehicle). Empty when none; legacy <see cref="VehicleId"/> may still mirror the first row.</summary>
    [property: JsonPropertyName("transportAssignments")] List<TourInstanceTransportAssignmentDto> TransportAssignments);

public sealed record TourInstancePlanAccommodationDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("roomType")] string RoomType,
    [property: JsonPropertyName("quantity")] int Quantity,
    [property: JsonPropertyName("supplierId")] Guid? SupplierId = null,
    [property: JsonPropertyName("supplierName")] string? SupplierName = null,
    [property: JsonPropertyName("supplierApprovalStatus")] string? SupplierApprovalStatus = null,
    [property: JsonPropertyName("supplierApprovalNote")] string? SupplierApprovalNote = null,
    [property: JsonPropertyName("roomBlocksTotal")] int RoomBlocksTotal = 0);
