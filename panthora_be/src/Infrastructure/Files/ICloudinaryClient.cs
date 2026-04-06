using CloudinaryDotNet.Actions;

namespace Infrastructure.Files;

public interface ICloudinaryClient
{
    Task<ImageUploadResult> UploadAsync(ImageUploadParams uploadParams, CancellationToken ct = default);
    Task<DelResResult> DeleteResourcesAsync(string[] publicIds);
}
