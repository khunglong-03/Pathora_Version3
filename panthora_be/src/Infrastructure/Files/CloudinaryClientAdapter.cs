using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace Infrastructure.Files;

internal sealed class CloudinaryClientAdapter : ICloudinaryClient
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryClientAdapter(Cloudinary cloudinary)
    {
        _cloudinary = cloudinary;
    }

    public Task<ImageUploadResult> UploadAsync(ImageUploadParams uploadParams, CancellationToken ct = default)
        => _cloudinary.UploadAsync(uploadParams, ct);

    public Task<DelResResult> DeleteResourcesAsync(string[] publicIds)
        => _cloudinary.DeleteResourcesAsync(publicIds);
}
