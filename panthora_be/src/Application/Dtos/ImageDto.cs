using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record ImageDto(
    [property: JsonPropertyName("fileId")] string? FileId,
    [property: JsonPropertyName("originalFileName")] string? OriginalFileName,
    [property: JsonPropertyName("fileName")] string? FileName,
    [property: JsonPropertyName("publicURL")] string? PublicURL
);
