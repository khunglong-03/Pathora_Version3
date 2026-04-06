using Application.Common.Interfaces;
using Application.Contracts.File;

namespace Application.Services;

public interface IFileService
{
    Task<FileMetadataVm> UploadFileAsync(UploadFileRequest request);
    Task<IEnumerable<FileMetadataVm>> UploadMultipleFilesAsync(UploadMultipleFilesRequest request);
    Task DeleteMultipleFilesAsync(DeleteMultipleFilesRequest request);
    Task DeleteUploadedFilesAsync(List<string> objectNames);
}

public class FileService(IFileManager fileManager) : IFileService
{
    public async Task<FileMetadataVm> UploadFileAsync(UploadFileRequest request)
    {
        var results = await fileManager.UploadMultipleFilesAsync(
            Guid.Empty,
            [(request.Stream, request.FileName, request.ContentType, request.Length)]);

        var f = results.FirstOrDefault()
                ?? throw new InvalidOperationException("Uploaded file metadata was not returned.");
        return new FileMetadataVm(f.Id, f.Url, f.OriginalFileName, f.MimeType, f.FileSize);
    }

    public async Task<IEnumerable<FileMetadataVm>> UploadMultipleFilesAsync(UploadMultipleFilesRequest request)
    {
        var uploadFiles = request.Files
            .Select(data => (data.Stream, data.FileName, data.ContentType, data.Length))
            .ToArray();
        var result = await fileManager.UploadMultipleFilesAsync(request.EntityId, uploadFiles);

        return result.Select(f => new FileMetadataVm(
            f.Id,
            f.Url,
            f.OriginalFileName,
            f.MimeType,
            f.FileSize));
    }

    public Task DeleteMultipleFilesAsync(DeleteMultipleFilesRequest request)
    {
        return fileManager.DeleteMultipleFilesAsync(request.FileIds);
    }

    public Task DeleteUploadedFilesAsync(List<string> objectNames)
    {
        return fileManager.DeleteUploadedFilesAsync(objectNames);
    }
}

