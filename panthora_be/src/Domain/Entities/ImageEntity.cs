namespace Domain.Entities;

public class ImageEntity
{
    public string? FileId { get; set; }
    public string? OriginalFileName { get; set; }
    public string? FileName { get; set; }
    public string? PublicURL { get; set; }

    public static ImageEntity Create(string fileId, string originalFileName, string fileName, string publicURL)
    {
        return new ImageEntity
        {
            FileId = fileId,
            OriginalFileName = originalFileName,
            FileName = fileName,
            PublicURL = publicURL
        };
    }
}
