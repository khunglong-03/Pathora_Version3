using Application.Dtos;
using System.Text.Json.Serialization;

namespace Application.Features.Tour.Queries;

public sealed record TourVm(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tourCode")] string TourCode,
    [property: JsonPropertyName("tourName")] string TourName,
    [property: JsonPropertyName("shortDescription")] string ShortDescription,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("thumbnail")] ImageDto? Thumbnail,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc);
