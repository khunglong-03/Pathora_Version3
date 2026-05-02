using Domain.Entities.Translations;
using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record TourClassificationDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tourId")] Guid TourId,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("basePrice")] decimal BasePrice,
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("numberOfDay")] int NumberOfDay,
    [property: JsonPropertyName("numberOfNight")] int NumberOfNight,
    [property: JsonPropertyName("plans")] List<TourDayDto> Plans,
    [property: JsonPropertyName("insurances")] List<TourInsuranceDto> Insurances,
    [property: JsonPropertyName("createdBy")] string? CreatedBy,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedBy")] string? LastModifiedBy,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc,
    [property: JsonPropertyName("translations")] Dictionary<string, TourClassificationTranslationData>? Translations = null
);
