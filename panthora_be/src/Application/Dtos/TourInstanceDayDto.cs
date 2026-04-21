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
    DateTimeOffset? ArrivalTime);

public sealed record TourInstancePlanAccommodationDto(
    Guid Id,
    string RoomType,
    int Quantity,
    Guid? SupplierId = null,
    string? SupplierName = null,
    string? SupplierApprovalStatus = null,
    string? SupplierApprovalNote = null,
    int RoomBlocksTotal = 0);
