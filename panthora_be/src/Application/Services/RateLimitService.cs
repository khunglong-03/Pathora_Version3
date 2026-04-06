using System.Collections.Concurrent;
using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace Application.Services;

public interface IRateLimitService
{
    (bool Allowed, int RetryAfterSeconds) CheckRateLimit(string key);
}

/// <summary>
/// Phase 5.5.1: Redis-backed sliding window rate limiter.
/// Uses IDistributedCache for cross-instance rate limiting in production.
/// Falls back to in-memory ConcurrentDictionary when IDistributedCache is not available
/// (Development environment).
/// </summary>
public sealed class RateLimitService : IRateLimitService
{
    private readonly int _rateLimitSeconds;
    private readonly ILogger<RateLimitService> _logger;
    private readonly IDistributedCache? _distributedCache;
    private readonly bool _useDistributedCache;

    // In-memory fallback for Development (when Redis is not available)
    private static readonly ConcurrentDictionary<string, DateTimeOffset> _memoryCache = new();

    private const string RateLimitCachePrefix = "ratelimit:";
    private static readonly DistributedCacheEntryOptions CacheOptions = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
    };

    public RateLimitService(
        int rateLimitSeconds,
        ILogger<RateLimitService> logger,
        IDistributedCache? distributedCache = null)
    {
        _rateLimitSeconds = rateLimitSeconds > 0 ? rateLimitSeconds : 5;
        _logger = logger;
        _distributedCache = distributedCache;
        _useDistributedCache = _distributedCache != null;
    }

    public (bool Allowed, int RetryAfterSeconds) CheckRateLimit(string key)
    {
        if (_useDistributedCache)
        {
            return CheckRateLimitDistributed(key);
        }
        return CheckRateLimitInMemory(key);
    }

    private (bool Allowed, int RetryAfterSeconds) CheckRateLimitDistributed(string key)
    {
        var cacheKey = RateLimitCachePrefix + key;
        var now = DateTimeOffset.UtcNow;

        try
        {
            var cachedJson = _distributedCache!.GetString(cacheKey);
            if (cachedJson != null)
            {
                var entry = JsonSerializer.Deserialize<RateLimitEntry>(cachedJson);
                if (entry != null)
                {
                    var elapsed = now - entry.LastCall;
                    if (elapsed.TotalSeconds < _rateLimitSeconds)
                    {
                        var retryAfter = _rateLimitSeconds - (int)elapsed.TotalSeconds;
                        _logger.LogDebug("Rate limit hit for key {Key}. Retry after {Seconds}s", key, retryAfter);
                        return (false, retryAfter);
                    }
                }
            }

            var newEntry = new RateLimitEntry { LastCall = now };
            _distributedCache!.SetString(cacheKey, JsonSerializer.Serialize(newEntry), CacheOptions);
            return (true, 0);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis rate limit check failed for key {Key}, falling back to in-memory", key);
            return CheckRateLimitInMemory(key);
        }
    }

    private (bool Allowed, int RetryAfterSeconds) CheckRateLimitInMemory(string key)
    {
        var now = DateTimeOffset.UtcNow;

        if (_memoryCache.TryGetValue(key, out var lastCall))
        {
            var elapsed = now - lastCall;
            if (elapsed.TotalSeconds < _rateLimitSeconds)
            {
                var retryAfter = _rateLimitSeconds - (int)elapsed.TotalSeconds;
                _logger.LogDebug("Rate limit hit for key {Key}. Retry after {Seconds}s", key, retryAfter);
                return (false, retryAfter);
            }
        }

        _memoryCache[key] = now;

        // Prune entries older than 10 minutes to prevent unbounded growth
        if (_memoryCache.Count > 10000)
        {
            var cutoff = now.AddMinutes(-10);
            foreach (var kvp in _memoryCache)
            {
                if (kvp.Value < cutoff)
                {
                    _memoryCache.TryRemove(kvp.Key, out _);
                }
            }
        }

        return (true, 0);
    }

    private sealed record RateLimitEntry
    {
        public DateTimeOffset LastCall { get; set; }
    }
}
