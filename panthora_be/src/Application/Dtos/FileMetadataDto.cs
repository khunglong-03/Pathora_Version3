using System.Text.Json.Serialization;

namespace Application.Dtos;

public sealed record FileMetadataDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("linkedEntityId")] Guid LinkedEntityId,
    [property: JsonPropertyName("originalFileName")] string OriginalFileName,
    [property: JsonPropertyName("storedFileName")] string StoredFileName,
    [property: JsonPropertyName("mimeType")] string MimeType,
    [property: JsonPropertyName("url")] string Url,
    [property: JsonPropertyName("fileSize")] long FileSize,
    [property: JsonPropertyName("isDeleted")] bool IsDeleted,
    [property: JsonPropertyName("createdBy")] string? CreatedBy,
    [property: JsonPropertyName("createdOnUtc")] DateTimeOffset CreatedOnUtc,
    [property: JsonPropertyName("lastModifiedBy")] string? LastModifiedBy,
    [property: JsonPropertyName("lastModifiedOnUtc")] DateTimeOffset? LastModifiedOnUtc
);
