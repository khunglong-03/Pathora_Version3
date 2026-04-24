using System.Text.Json.Serialization;

namespace Application.Contracts.Position;

public sealed record UpdatePositionRequest(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("level")] int Level,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("type")] int? Type
);

