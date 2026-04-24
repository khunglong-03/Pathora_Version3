using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record TourInstanceManagerDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("userId")] Guid UserId,
    [property: JsonPropertyName("userName")] string UserName,
    [property: JsonPropertyName("userAvatar")] string? UserAvatar,
    [property: JsonPropertyName("role")] string Role);
