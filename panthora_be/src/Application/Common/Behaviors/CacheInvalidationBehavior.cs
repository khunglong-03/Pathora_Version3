using Contracts.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;
using ZiggyCreatures.Caching.Fusion;

namespace Application.Common.Behaviors;

public sealed class CacheInvalidationBehavior<TRequest, TResponse>(
    IFusionCache cache,
    CacheKeyTracker cacheKeyTracker,
    ILogger<CacheInvalidationBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
    where TResponse : notnull
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var response = await next();

        if (request is not ICacheInvalidator invalidator)
            return response;

        foreach (var tag in invalidator.CacheKeysToInvalidate)
        {
            var keys = cacheKeyTracker.GetKeys(tag);
            foreach (var key in keys)
            {
                logger.LogDebug("[CACHE INVALIDATE] Key={Key} Tag={Tag}", key, tag);
                await cache.RemoveAsync(key, token: cancellationToken);
            }
            cacheKeyTracker.RemoveKeys(tag);
        }

        return response;
    }
}
