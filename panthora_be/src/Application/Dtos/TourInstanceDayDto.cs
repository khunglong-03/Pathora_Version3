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
    List<TourInstancePlanRouteDto>? Routes);

public sealed record TourInstancePlanAccommodationDto(
    Guid Id,
    string RoomType,
    int Quantity,
    int RoomBlocksTotal = 0);

public sealed record TourInstancePlanRouteDto(
    Guid Id,
    Guid? VehicleId,
    DateTimeOffset? DepartureTime,
    DateTimeOffset? ArrivalTime,
    // Vehicle info
    string? VehiclePlate,
    string? VehicleType,
    string? VehicleBrand,
    string? VehicleModel,
    int? SeatCapacity,
    // Driver info
    Guid? DriverId,
    string? DriverName,
    string? DriverPhone,
    // Location info
    string? PickupLocation,
    string? DropoffLocation);
