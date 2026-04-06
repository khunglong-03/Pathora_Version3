using Domain.Abstractions;

namespace Domain.Entities;

public class FileMetadataEntity : Aggregate<Guid>
{

    public Guid LinkedEntityId { get; set; }
    public string OriginalFileName { get; set; } = null!;
    public string StoredFileName { get; set; } = null!;
    public string MimeType { get; set; } = null!;
    public string Url { get; set; } = null!;
    public long FileSize { get; set; }
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
