using Domain.Entities.Translations;
using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record TourDayDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("classificationId")] Guid ClassificationId,
    [property: JsonPropertyName("dayNumber")] int DayNumber,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("description")] string? Description,
    [property: JsonPropertyName("activities")] List<TourDayActivityDto> Activities,
    [property: JsonPropertyName("createdBy")] string? CreatedBy,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedBy")] string? LastModifiedBy,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc,
    [property: JsonPropertyName("translations")] Dictionary<string, TourDayTranslationData>? Translations = null
);
