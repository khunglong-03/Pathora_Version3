using Domain.Entities;

namespace Application.Common.Interfaces;

public sealed record AvatarUploadResult(string Url, string PublicId);

public interface IFileManager
{
    public Task<string> UploadFileAsync(
        Stream stream,
        string fileName,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Uploads an avatar image to cloud storage and returns both URL and PublicId.
    /// Use this for avatar uploads where rollback via PublicId is needed.
    /// </summary>
    public Task<AvatarUploadResult> UploadAvatarAsync(
        Stream stream,
        string fileName,
        CancellationToken cancellationToken = default);

    public Task<IEnumerable<FileMetadataEntity>> UploadMultipleFilesAsync(
        Guid entityId,
        (Stream Stream, string FileName, string ContentType, long Length)[] files,
        CancellationToken cancellationToken = default);

    public Task<Dictionary<Guid, FileMetadataEntity[]>> FindFiles(string[] entityIds);

    public Task DeleteMultipleFilesAsync(
        List<Guid> ids,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes files from cloud storage by their public IDs.
    /// Used for rollback when an operation (e.g., tour creation) fails after files were uploaded.
    /// </summary>
    public Task DeleteUploadedFilesAsync(List<string> objectNames, CancellationToken cancellationToken = default);

    public Task<Stream> DownloadFileAsync(
        string fileUrl,
        CancellationToken cancellationToken = default);
}
