namespace Application.Dtos;

public sealed record FileMetadataDto(
    Guid Id,
    Guid LinkedEntityId,
    string OriginalFileName,
    string StoredFileName,
    string MimeType,
    string Url,
    long FileSize,
    bool IsDeleted,
    string? CreatedBy,
    DateTimeOffset CreatedOnUtc,
    string? LastModifiedBy,
    DateTimeOffset? LastModifiedOnUtc
);
