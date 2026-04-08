using Domain.Abstractions;

namespace Domain.Entities;

/// <summary>
/// Metadata đầy đủ của file đã upload. Gắn với một thực thể qua LinkedEntityId,
/// lưu tên gốc, tên lưu, MIME type, URL, và kích thước file.
/// </summary>
public class FileMetadataEntity : Aggregate<Guid>
{
    /// <summary>ID của thực thể mà file này được gắn vào (VD: BookingId, TourId).</summary>
    public Guid LinkedEntityId { get; set; }
    /// <summary>Tên file gốc khi người dùng upload.</summary>
    public string OriginalFileName { get; set; } = null!;
    /// <summary>Tên file sau khi được lưu trên storage.</summary>
    public string StoredFileName { get; set; } = null!;
    /// <summary>MIME type của file (VD: image/png, application/pdf).</summary>
    public string MimeType { get; set; } = null!;
    /// <summary>URL công khai hoặc đường dẫn nội bộ đến file.</summary>
    public string Url { get; set; } = null!;
    /// <summary>Kích thước file tính bằng byte.</summary>
    public long FileSize { get; set; }
    /// <summary>Đánh dấu đã xóa mềm.</summary>
    public bool IsDeleted { get; set; }

    public static FileMetadataEntity Create(Guid linkedEntityId, string originalFileName, string storedFileName, string mimeType, string url, long fileSize, string performedBy)
    {
        return new FileMetadataEntity
        {
            LinkedEntityId = linkedEntityId,
            OriginalFileName = originalFileName,
            StoredFileName = storedFileName,
            MimeType = mimeType,
            Url = url,
            FileSize = fileSize,
            CreatedBy = performedBy,
            LastModifiedBy = performedBy,
            CreatedOnUtc = DateTimeOffset.UtcNow,
            LastModifiedOnUtc = DateTimeOffset.UtcNow
        };
    }

    public void SoftDelete(string performedBy)
    {
        IsDeleted = true;
        LastModifiedBy = performedBy;
        LastModifiedOnUtc = DateTimeOffset.UtcNow;
    }
}
