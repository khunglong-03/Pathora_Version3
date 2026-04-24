using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record TourInstanceGuideDto(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("avatarUrl")] string? AvatarUrl,
    [property: JsonPropertyName("languages")] List<string> Languages,
    [property: JsonPropertyName("experience")] string? Experience);
