namespace Application.Contracts.File;

public sealed record UploadMultipleFilesRequest(Guid EntityId, IEnumerable<FileData> Files);

public sealed record FileData(Stream Stream, string FileName, string ContentType, long Length);

public sealed record FileMetadataVm(Guid Id, string Url, string Name, string Type, long Size);
