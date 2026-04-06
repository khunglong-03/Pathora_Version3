using Contracts.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;
using ZiggyCreatures.Caching.Fusion;

namespace Application.Common.Behaviors;

public sealed class CachingBehavior<TRequest, TResponse>(
    IFusionCache cache,
    CacheKeyTracker cacheKeyTracker,
    ILogger<CachingBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
    where TResponse : notnull
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (request is not ICacheable cacheable)
            return await next();

        var cacheKey = cacheable.CacheKey;

        var cached = await cache.TryGetAsync<TResponse>(cacheKey, token: cancellationToken);
        if (cached.HasValue)
        {
            logger.LogDebug("[CACHE HIT] Key={CacheKey}", cacheKey);
            return cached.Value;
        }

        logger.LogDebug("[CACHE MISS] Key={CacheKey}", cacheKey);
        var response = await next();

        var entryOptions = new FusionCacheEntryOptions
        {
            Duration = cacheable.Expiration ?? TimeSpan.FromMinutes(5)
        };

        await cache.SetAsync(cacheKey, response, entryOptions, cancellationToken);

        var tag = ExtractTag(cacheKey);
        if (tag is not null)
            cacheKeyTracker.Track(tag, cacheKey);

        return response;
    }

    private static string? ExtractTag(string cacheKey)
    {
        var colonIndex = cacheKey.IndexOf(':');
        return colonIndex > 0 ? cacheKey[..colonIndex] : null;
    }
}
