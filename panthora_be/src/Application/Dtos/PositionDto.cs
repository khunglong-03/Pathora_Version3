using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record PositionDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("level")] int Level,
    [property: JsonPropertyName("note")] string? Note,
    [property: JsonPropertyName("type")] int? Type,
    [property: JsonPropertyName("isDeleted")] bool IsDeleted,
    [property: JsonPropertyName("createdBy")] string? CreatedBy,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedBy")] string? LastModifiedBy,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc
);
