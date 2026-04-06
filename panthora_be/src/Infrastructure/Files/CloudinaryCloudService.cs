using Application.Common.Interfaces;
using CloudinaryDotNet.Actions;
using Common.Models;
using Infrastructure.Exceptions;
using Infrastructure.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infrastructure.Files;

public sealed class CloudinaryCloudService : ICloudinaryService
{
    private readonly ICloudinaryClient _client;
    private readonly string _defaultFolder;
    private readonly ILogger<CloudinaryCloudService> _logger;

    public CloudinaryCloudService(ICloudinaryClient client, IOptions<StorageOptions> storageOptions, ILogger<CloudinaryCloudService> logger)
    {
        _client = client;
        _defaultFolder = storageOptions.Value.DefaultFolder;
        _logger = logger;
    }

    public async Task<List<UploadFileResult>> UploadFilesAsync(
        List<UploadFileBytes> files,
        string folder,
        CancellationToken ct = default)
    {
        var results = new List<UploadFileResult>();

        foreach (var f in files)
        {
            var publicId = $"{Guid.NewGuid()}{Path.GetExtension(f.FileName)}";
            var folderPath = string.IsNullOrEmpty(folder) ? _defaultFolder : folder;

            await using var stream = new MemoryStream(f.Bytes);
            var uploadParams = new ImageUploadParams
            {
                File = new CloudinaryDotNet.FileDescription(f.FileName, stream),
                PublicId = publicId,
                Folder = folderPath,
                UseFilenameAsDisplayName = false,
                UniqueFilename = false,
                Overwrite = true,
            };

            try
            {
                var uploadResult = await _client.UploadAsync(uploadParams, ct);
                results.Add(new UploadFileResult
                {
                    FileId = publicId,
                    FolderName = folderPath,
                    OriginalFileName = f.FileName,
                    FileName = publicId,
                    FileSize = f.Bytes.Length,
                    ContentType = f.ContentType,
                    PublicUrl = uploadResult.SecureUrl.ToString(),
                });
                _logger.LogInformation(
                    "Cloudinary upload success: {FileName}, {FileSize} bytes, URL: {Url}",
                    f.FileName,
                    f.Bytes.Length,
                    uploadResult.SecureUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Cloudinary upload failed for {FileName}", f.FileName);
                throw new InfrastructureException($"Cloudinary upload failed for file '{f.FileName}': {ex.Message}", ex);
            }
        }

        return results;
    }

    public async Task DeleteFilesAsync(List<string> publicIds, CancellationToken ct = default)
    {
        if (publicIds.Count == 0) return;

        try
        {
            await _client.DeleteResourcesAsync(publicIds.ToArray());
            _logger.LogInformation("Cloudinary delete completed: {Count} files", publicIds.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cloudinary delete failed for {Count} files", publicIds.Count);
            throw new InfrastructureException($"Cloudinary delete failed: {ex.Message}", ex);
        }
    }
}
