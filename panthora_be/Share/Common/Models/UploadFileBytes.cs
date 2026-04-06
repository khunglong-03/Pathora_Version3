namespace Common.Models;

public sealed class UploadFileBytes
{
    public required string FileName { get; init; }
    public required string ContentType { get; init; }
    public required byte[] Bytes { get; init; }
}
