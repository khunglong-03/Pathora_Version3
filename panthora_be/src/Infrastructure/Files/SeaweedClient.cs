using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace Infrastructure.Files;

public record AssignResponse(
    int Count,
    string Fid,
    string Url,
    string PublicUrl
);

public record LookupLocation(string Url, string PublicUrl);

public record LookupResponse(string VolumeId, IEnumerable<LookupLocation> Locations);

public record UploadResponse(string Name, long Size, string ETag);

public interface ISeaweedClient : IDisposable
{
    Task<AssignResponse> AssignAsync(
        TimeSpan? ttl = null,
        int count = 1,
        string? collection = null,
        CancellationToken cancellationToken = default);

    Task<LookupResponse> LookupAsync(
        string volumeId,
        CancellationToken cancellationToken = default);

    Task<UploadResponse> UploadAsync(
        Stream stream,
        string fileName,
        string uploadUrl,
        CancellationToken cancellationToken = default);

    Task<Stream> DownloadAsync(
        string fileUrl,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        string fileUrl,
        CancellationToken cancellationToken = default);
}

public class SeaweedClient : ISeaweedClient
{
    private readonly HttpClient _httpClient;

    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private bool _disposed;

    public SeaweedClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.Timeout = TimeSpan.FromSeconds(30);
    }

    public async Task<AssignResponse> AssignAsync(
        TimeSpan? ttl = null,
        int count = 1,
        string? collection = null,
        CancellationToken cancellationToken = default)
    {
        var query = new List<string>();
        if (ttl.HasValue) query.Add($"ttl={(int)ttl.Value.TotalMinutes}m");
        if (count > 1) query.Add($"count={count}");
        if (!string.IsNullOrEmpty(collection)) query.Add($"collection={Uri.EscapeDataString(collection)}");

        var uri = "/dir/assign" + (query.Count != 0 ? "?" + string.Join("&", query) : "");

        var response = await _httpClient.GetAsync(uri, cancellationToken);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<AssignResponse>(_jsonOptions, cancellationToken)
               ?? throw new InvalidOperationException("Invalid assign response");
    }

    public async Task<LookupResponse> LookupAsync(
        string volumeId,
        CancellationToken cancellationToken = default)
    {
        var uri = $"/dir/lookup?volumeId={Uri.EscapeDataString(volumeId)}";

        var response = await _httpClient.GetAsync(uri, cancellationToken);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<LookupResponse>(_jsonOptions, cancellationToken)
               ?? throw new InvalidOperationException("Invalid lookup response");
    }

    public async Task<UploadResponse> UploadAsync(
        Stream stream,
        string fileName,
        string uploadUrl,
        CancellationToken cancellationToken = default)
    {
        using var content = new MultipartFormDataContent();
        stream.Position = 0;
        var fileContent = new StreamContent(stream);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
        content.Add(fileContent, "file", fileName);

        var response = await _httpClient.PostAsync(uploadUrl, content, cancellationToken);
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<UploadResponse>(_jsonOptions, cancellationToken)
               ?? throw new InvalidOperationException("Invalid upload response");
    }

    public async Task<Stream> DownloadAsync(
        string fileUrl,
        CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.GetAsync(fileUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();
        var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream, cancellationToken);
        memoryStream.Position = 0;
        return memoryStream;
    }

    public async Task DeleteAsync(
        string fileUrl,
        CancellationToken cancellationToken = default)
    {
        var response = await _httpClient.DeleteAsync(fileUrl, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    public void Dispose()
    {
        if (_disposed) return;
        _httpClient.Dispose();
        _disposed = true;
    }
}

