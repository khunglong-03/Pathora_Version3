namespace Application.Contracts.File;

public sealed record UploadFileRequest(
    Stream Stream,
    string FileName,
    string ContentType = "application/octet-stream",
    long Length = 0
);
