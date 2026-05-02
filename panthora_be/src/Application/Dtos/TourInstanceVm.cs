using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record TourInstanceVm(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tourId")] Guid TourId,
    [property: JsonPropertyName("tourInstanceCode")] string TourInstanceCode,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("tourName")] string TourName,
    [property: JsonPropertyName("tourCode")] string TourCode,
    [property: JsonPropertyName("classificationName")] string ClassificationName,
    [property: JsonPropertyName("location")] string? Location,
    [property: JsonPropertyName("thumbnail")] ImageDto? Thumbnail,
    [property: JsonPropertyName("images")] List<ImageDto> Images,
    [property: JsonPropertyName("startDate")] DateTimeOffset StartDate,
    [property: JsonPropertyName("endDate")] DateTimeOffset EndDate,
    [property: JsonPropertyName("durationDays")] int DurationDays,
    [property: JsonPropertyName("currentParticipation")] int CurrentParticipation,
    [property: JsonPropertyName("maxParticipation")] int MaxParticipation,
    [property: JsonPropertyName("basePrice")] decimal BasePrice,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("wantsCustomization")] bool WantsCustomization,
    [property: JsonPropertyName("customizationNotes")] string? CustomizationNotes,
    [property: JsonPropertyName("instanceType")] string InstanceType);
