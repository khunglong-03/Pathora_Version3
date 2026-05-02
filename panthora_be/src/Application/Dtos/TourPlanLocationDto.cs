using Domain.Enums;
using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record TourPlanLocationDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("locationName")] string LocationName,
    [property: JsonPropertyName("locationDescription")] string? LocationDescription,
    [property: JsonPropertyName("locationType")] LocationType LocationType,
    [property: JsonPropertyName("address")] string? Address,
    [property: JsonPropertyName("city")] string? City,
    [property: JsonPropertyName("country")] string? Country,
    [property: JsonPropertyName("latitude")] decimal? Latitude,
    [property: JsonPropertyName("longitude")] decimal? Longitude,
    [property: JsonPropertyName("entranceFee")] decimal? EntranceFee,
    [property: JsonPropertyName("openingHours")] TimeOnly? OpeningHours,
    [property: JsonPropertyName("closingHours")] TimeOnly? ClosingHours,
    [property: JsonPropertyName("estimatedDurationMinutes")] int? EstimatedDurationMinutes,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("createdBy")] string? CreatedBy,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedBy")] string? LastModifiedBy,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc
);
