using System.Text.Json.Serialization;

namespace Application.Contracts.File;

public sealed record DeleteMultipleFilesRequest(
    [property: JsonPropertyName("fileIds")] List<Guid> FileIds);
