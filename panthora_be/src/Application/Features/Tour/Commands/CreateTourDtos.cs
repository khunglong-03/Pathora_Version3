using Domain.Entities.Translations;
using Domain.Enums;

namespace Application.Features.Tour.Commands;

public sealed record ClassificationDto(
    Guid? Id,
    string Name,
    string Description,
    decimal BasePrice,
    int NumberOfDay,
    int NumberOfNight,
    List<DayPlanDto> Plans,
    List<InsuranceDto> Insurances,
    Dictionary<string, TourClassificationTranslationData>? Translations = null
);

public sealed record DayPlanDto(
    Guid? Id,
    int DayNumber,
    string Title,
    string? Description,
    List<ActivityDto> Activities,
    Dictionary<string, TourDayTranslationData>? Translations = null
);

public sealed record ActivityDto(
    Guid? Id,
    string ActivityType,
    string Title,
    string? Description,
    string? Note,
    decimal? EstimatedCost,
    bool IsOptional,
    string? StartTime,
    string? EndTime,
    List<RouteDto> Routes,
    AccommodationDto? Accommodation,
    Dictionary<string, TourDayActivityTranslationData>? Translations = null,
    List<string>? LinkToResources = null
);

public sealed record RouteDto(
    string TransportationType,
    string? FromLocationName,
    string? ToLocationName,
    Guid? FromLocationId,
    Guid? ToLocationId,
    string? TransportationName,
    int? DurationMinutes,
    string? PricingType,
    decimal? Price,
    bool RequiresIndividualTicket,
    string? TicketInfo,
    string? Note,
    Dictionary<string, TourPlanLocationTranslationData>? Translations,
    Dictionary<string, TourPlanRouteTranslationData>? RouteTranslations
);

public sealed record InsuranceDto(
    string InsuranceName,
    string InsuranceType,
    string InsuranceProvider,
    string CoverageDescription,
    decimal CoverageAmount,
    decimal CoverageFee,
    bool IsOptional,
    string? Note,
    Dictionary<string, TourClassificationTranslationData>? Translations = null
);

public sealed record AccommodationDto(
    string AccommodationName,
    string? Address,
    string? ContactPhone,
    string? CheckInTime,
    string? CheckOutTime,
    string? Note,
    string? RoomType,
    int? RoomCapacity,
    string? MealsIncluded,
    decimal? RoomPrice,
    int? NumberOfRooms,
    int? NumberOfNights,
    decimal? Latitude,
    decimal? Longitude,
    string? SpecialRequest,
    Dictionary<string, TourPlanAccommodationTranslationData>? Translations = null
);

public sealed record LocationDto(
    string LocationName,
    string LocationType,
    string? Description,
    string? City,
    string? Country,
    decimal? EntranceFee,
    string? Address,
    Dictionary<string, TourPlanLocationTranslationData>? Translations = null
);

public sealed record ServiceDto(
    Guid? Id,
    string ServiceName,
    string? PricingType,
    decimal? Price,
    decimal? SalePrice,
    string? Email,
    string? ContactNumber,
    Dictionary<string, TourResourceTranslationData>? Translations = null
);

public sealed record TransportationDto(
    string TransportationType,
    string? FromLocationName = null,
    string? ToLocationName = null,
    Guid? FromLocationId = null,
    Guid? ToLocationId = null,
    string? TransportationName = null,
    int? DurationMinutes = null,
    string? PricingType = null,
    decimal? Price = null,
    bool RequiresIndividualTicket = false,
    string? TicketInfo = null,
    string? Note = null,
    Dictionary<string, TourTransportationTranslationData>? Translations = null
);

public sealed record TourTransportationTranslationData(
    string? FromLocationName,
    string? ToLocationName,
    string? TransportationName,
    string? TicketInfo,
    string? Note
);
