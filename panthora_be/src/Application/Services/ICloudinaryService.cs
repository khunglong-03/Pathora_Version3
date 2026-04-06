using Common.Models;

namespace Application.Common.Interfaces;

public interface ICloudinaryService
{
    Task<List<UploadFileResult>> UploadFilesAsync(
        List<UploadFileBytes> files,
        string folder,
        CancellationToken ct = default);

    Task DeleteFilesAsync(List<string> publicIds, CancellationToken ct = default);
}
