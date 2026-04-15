using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;

namespace Application.Common.Behaviors;

public sealed class CacheKeyTracker(IDistributedCache distributedCache)
{
    private readonly SemaphoreSlim _semaphore = new(1, 1);
    private readonly IDistributedCache _distributedCache = distributedCache;

    public async Task TrackAsync(string tag, string cacheKey, CancellationToken cancellationToken = default)
    {
        var trackerKey = $"tracker:{tag}";
        await _semaphore.WaitAsync(cancellationToken);
        try
        {
            var keys = await GetKeysInternalAsync(trackerKey, cancellationToken);
            if (keys.Add(cacheKey))
            {
                var json = JsonSerializer.Serialize(keys);
                await _distributedCache.SetStringAsync(trackerKey, json, cancellationToken);
            }
        }
        finally
        {
            _semaphore.Release();
        }
    }

    public async Task<IReadOnlyList<string>> GetKeysAsync(string tag, CancellationToken cancellationToken = default)
    {
        var trackerKey = $"tracker:{tag}";
        var keys = await GetKeysInternalAsync(trackerKey, cancellationToken);
        return [.. keys];
    }

    public async Task RemoveKeysAsync(string tag, CancellationToken cancellationToken = default)
    {
        var trackerKey = $"tracker:{tag}";
        await _distributedCache.RemoveAsync(trackerKey, cancellationToken);
    }

    private async Task<HashSet<string>> GetKeysInternalAsync(string trackerKey, CancellationToken cancellationToken)
    {
        var json = await _distributedCache.GetStringAsync(trackerKey, cancellationToken);
        if (string.IsNullOrEmpty(json))
            return [];

        try
        {
            return JsonSerializer.Deserialize<HashSet<string>>(json) ?? [];
        }
        catch
        {
            return [];
        }
    }
}
