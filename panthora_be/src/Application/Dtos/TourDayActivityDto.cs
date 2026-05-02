using Domain.Entities.Translations;
using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record TourDayActivityDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tourDayId")] Guid TourDayId,
    [property: JsonPropertyName("order")] int Order,
    [property: JsonPropertyName("activityType")] TourDayActivityType ActivityType,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("estimatedCost")] decimal? EstimatedCost,
    [property: JsonPropertyName("isOptional")] bool IsOptional,
    [property: JsonPropertyName("startTime")] TimeOnly? StartTime,
    [property: JsonPropertyName("endTime")] TimeOnly? EndTime,
    [property: JsonPropertyName("fromLocationId")] Guid? FromLocationId,
    [property: JsonPropertyName("fromLocationName")] string? FromLocationName,
    [property: JsonPropertyName("toLocationId")] Guid? ToLocationId,
    [property: JsonPropertyName("toLocationName")] string? ToLocationName,
    [property: JsonPropertyName("transportationType")] string? TransportationType,
    [property: JsonPropertyName("transportationName")] string? TransportationName,
    [property: JsonPropertyName("durationMinutes")] int? DurationMinutes,
    [property: JsonPropertyName("distanceKm")] decimal? DistanceKm,
    [property: JsonPropertyName("price")] decimal? Price,
    [property: JsonPropertyName("bookingReference")] string? BookingReference,
    [property: JsonPropertyName("accommodation")] TourPlanAccommodationDto? Accommodation,
    [property: JsonPropertyName("createdBy")] string? CreatedBy,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedBy")] string? LastModifiedBy,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc,
    [property: JsonPropertyName("translations")] Dictionary<string, TourDayActivityTranslationData>? Translations = null,
    [property: JsonPropertyName("enTransportationType")] string? EnTransportationType = null,
    [property: JsonPropertyName("enTransportationName")] string? EnTransportationName = null
);
