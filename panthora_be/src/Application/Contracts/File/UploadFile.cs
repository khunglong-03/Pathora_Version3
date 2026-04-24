using System.Text.Json.Serialization;

namespace Application.Contracts.File;

public sealed record UploadFileRequest(
    [property: JsonPropertyName("stream")] Stream Stream,
    [property: JsonPropertyName("fileName")] string FileName,
    [property: JsonPropertyName("contentType")] string ContentType = "application/octet-stream",
    [property: JsonPropertyName("length")] long Length = 0);
