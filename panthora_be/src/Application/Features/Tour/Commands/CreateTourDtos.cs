using Domain.Entities.Translations;
using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Features.Tour.Commands;

public sealed record ClassificationDto(
    [property: JsonPropertyName("id")] Guid? Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("description")] string Description,
    // BasePrice is auto-derived server-side from the sum of activity costs in
    // TourService.Create / UpdateClassificationsAsync (RecalculateBasePrice).
    // The value sent by the client is accepted for backward-compat but ignored on persist.
    [property: JsonPropertyName("basePrice")] decimal BasePrice,
    [property: JsonPropertyName("numberOfDay")] int NumberOfDay,
    [property: JsonPropertyName("numberOfNight")] int NumberOfNight,
    [property: JsonPropertyName("plans")] List<DayPlanDto> Plans,
    [property: JsonPropertyName("insurances")] List<InsuranceDto> Insurances,
    [property: JsonPropertyName("translations")] Dictionary<string, TourClassificationTranslationData>? Translations = null
);

public sealed record DayPlanDto(
    [property: JsonPropertyName("id")] Guid? Id,
    [property: JsonPropertyName("dayNumber")] int DayNumber,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("activities")] List<ActivityDto> Activities,
    [property: JsonPropertyName("translations")] Dictionary<string, TourDayTranslationData>? Translations = null
);

public sealed record ActivityDto(
    [property: JsonPropertyName("id")] Guid? Id = null,
    [property: JsonPropertyName("activityType")] string ActivityType = "",
    [property: JsonPropertyName("title")] string Title = "",
    [property: JsonPropertyName("description")] string? Description = null,
    [property: JsonPropertyName("note")] string? Note = null,
    [property: JsonPropertyName("estimatedCost")] decimal? EstimatedCost = null,
    [property: JsonPropertyName("isOptional")] bool IsOptional = false,
    [property: JsonPropertyName("startTime")] string? StartTime = null,
    [property: JsonPropertyName("endTime")] string? EndTime = null,
    [property: JsonPropertyName("fromLocationId")] Guid? FromLocationId = null,
    [property: JsonPropertyName("toLocationId")] Guid? ToLocationId = null,
    [property: JsonPropertyName("transportationType")] string? TransportationType = null,
    [property: JsonPropertyName("transportationName")] string? TransportationName = null,
    [property: JsonPropertyName("durationMinutes")] int? DurationMinutes = null,
    [property: JsonPropertyName("distanceKm")] decimal? DistanceKm = null,
    [property: JsonPropertyName("price")] decimal? Price = null,
    [property: JsonPropertyName("bookingReference")] string? BookingReference = null,
    [property: JsonPropertyName("accommodation")] AccommodationDto? Accommodation = null,
    [property: JsonPropertyName("translations")] Dictionary<string, TourDayActivityTranslationData>? Translations = null
);



public sealed record InsuranceDto(
    [property: JsonPropertyName("id")] Guid? Id,
    [property: JsonPropertyName("insuranceName")] string InsuranceName,
    [property: JsonPropertyName("insuranceType")] string InsuranceType,
    [property: JsonPropertyName("insuranceProvider")] string InsuranceProvider,
    [property: JsonPropertyName("coverageDescription")] string CoverageDescription,
    [property: JsonPropertyName("coverageAmount")] decimal CoverageAmount,
    [property: JsonPropertyName("coverageFee")] decimal CoverageFee,
    [property: JsonPropertyName("isOptional")] bool IsOptional,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("translations")] Dictionary<string, TourClassificationTranslationData>? Translations = null
);

public sealed record AccommodationDto(
    [property: JsonPropertyName("accommodationName")] string? AccommodationName,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("contactPhone")] string? ContactPhone,
    [property: JsonPropertyName("checkInTime")] string? CheckInTime,
    [property: JsonPropertyName("checkOutTime")] string? CheckOutTime,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("roomType")] string? RoomType,
    [property: JsonPropertyName("roomCapacity")] int? RoomCapacity,
    [property: JsonPropertyName("mealsIncluded")] string? MealsIncluded,
    [property: JsonPropertyName("roomPrice")] decimal? RoomPrice,
    [property: JsonPropertyName("numberOfRooms")] int? NumberOfRooms,
    [property: JsonPropertyName("numberOfNights")] int? NumberOfNights,
    [property: JsonPropertyName("latitude")] decimal? Latitude,
    [property: JsonPropertyName("longitude")] decimal? Longitude,
    [property: JsonPropertyName("specialRequest")] string? SpecialRequest,
    [property: JsonPropertyName("translations")] Dictionary<string, TourPlanAccommodationTranslationData>? Translations = null
);

public sealed record LocationDto(
    [property: JsonPropertyName("locationName")] string LocationName,
    [property: JsonPropertyName("locationType")] string LocationType,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("city")] string? City,
    [property: JsonPropertyName("country")] string? Country,
    [property: JsonPropertyName("entranceFee")] decimal? EntranceFee,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("translations")] Dictionary<string, TourPlanLocationTranslationData>? Translations = null
);

public sealed record ServiceDto(
    [property: JsonPropertyName("id")] Guid? Id,
    [property: JsonPropertyName("serviceName")] string ServiceName,
    [property: JsonPropertyName("pricingType")] string? PricingType,
    [property: JsonPropertyName("price")] decimal? Price,
    [property: JsonPropertyName("email")] string? Email,
    [property: JsonPropertyName("contactNumber")] string? ContactNumber,
    [property: JsonPropertyName("translations")] Dictionary<string, TourResourceTranslationData>? Translations = null
);

public sealed record TransportationDto(
    [property: JsonPropertyName("transportationType")] string TransportationType,
    [property: JsonPropertyName("fromLocationName")] string? FromLocationName = null,
    [property: JsonPropertyName("toLocationName")] string? ToLocationName = null,
    [property: JsonPropertyName("fromLocationId")] Guid? FromLocationId = null,
    [property: JsonPropertyName("toLocationId")] Guid? ToLocationId = null,
    [property: JsonPropertyName("transportationName")] string? TransportationName = null,
    [property: JsonPropertyName("durationMinutes")] int? DurationMinutes = null,
    [property: JsonPropertyName("pricingType")] string? PricingType = null,
    [property: JsonPropertyName("price")] decimal? Price = null,
    [property: JsonPropertyName("requiresIndividualTicket")] bool RequiresIndividualTicket = false,
    [property: JsonPropertyName("ticketInfo")] string? TicketInfo = null,
    [property: JsonPropertyName("note")] string? Note = null,
    [property: JsonPropertyName("translations")] Dictionary<string, TourTransportationTranslationData>? Translations = null
);

public sealed record TourTransportationTranslationData(
    [property: JsonPropertyName("fromLocationName")] string? FromLocationName,
    [property: JsonPropertyName("toLocationName")] string? ToLocationName,
    [property: JsonPropertyName("transportationName")] string? TransportationName,
    [property: JsonPropertyName("ticketInfo")] string? TicketInfo,
    [property: JsonPropertyName("note")] string? Note
);
