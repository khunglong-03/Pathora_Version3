namespace Domain.Entities;

/// <summary>
/// Đại diện hình ảnh với thông tin lưu trữ cơ bản. Dùng cho các
/// trường hợp cần lưu nhanh thông tin ảnh mà không cần full metadata.
/// </summary>
public class ImageEntity
{
    /// <summary>ID file trên storage.</summary>
    public string? FileId { get; set; }
    /// <summary>Tên file gốc khi upload.</summary>
    public string? OriginalFileName { get; set; }
    /// <summary>Tên file đã được lưu trên storage.</summary>
    public string? FileName { get; set; }
    /// <summary>URL công khai của ảnh.</summary>
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