using System.Text.Json.Serialization;

namespace Application.Contracts.File;

public sealed record UploadMultipleFilesRequest(
    [property: JsonPropertyName("entityId")] Guid EntityId,
    [property: JsonPropertyName("files")] IEnumerable<FileData> Files);

public sealed record FileData(
    Stream Stream,
    [property: JsonPropertyName("fileName")] string FileName,
    [property: JsonPropertyName("contentType")] string ContentType,
    [property: JsonPropertyName("length")] long Length);

public sealed record FileMetadataVm(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("url")] string Url,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("type")] string Type,
    [property: JsonPropertyName("size")] long Size);
