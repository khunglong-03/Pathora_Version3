using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record ImageInputDto(
    [property: JsonPropertyName("fileId")] string FileId,
    [property: JsonPropertyName("originalFileName")] string OriginalFileName,
    [property: JsonPropertyName("fileName")] string FileName,
    [property: JsonPropertyName("publicUrl")] string PublicURL
);
