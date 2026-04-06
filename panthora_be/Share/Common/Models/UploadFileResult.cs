namespace Common.Models;

public sealed class UploadFileResult
{
    public string FileId { get; set; } = Guid.NewGuid().ToString();
    public string? FolderName { get; set; }
    public string? OriginalFileName { get; set; }
    public string? FileName { get; set; }
    public long FileSize { get; set; }
    public string? ContentType { get; set; }
    public string? PublicUrl { get; set; }
}
