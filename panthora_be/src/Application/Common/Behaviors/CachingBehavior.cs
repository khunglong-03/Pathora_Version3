using System.Linq.Expressions;
using System.Reflection;
using Contracts.Interfaces;
using ErrorOr;
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
    // Bumped when cache value layout changes. Old entries (which stored the full
    // ErrorOr<T> struct) live under the un-prefixed key and are ignored by the new
    // code path, then expire naturally.
    private const string ErrorOrKeyPrefix = "eo:";

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (request is not ICacheable cacheable)
            return await next();

        // ErrorOr<T> is a struct whose IsError/Errors/Value state does not survive a
        // System.Text.Json round-trip (private state, no settable Value). Caching it
        // returns default(ErrorOr<T>) on hit → IsError=false, Value=null → controllers
        // emit "200 OK + data:null". Cache the raw inner value T instead and rebuild
        // ErrorOr<T> on the way out via the implicit T → ErrorOr<T> operator.
        if (ErrorOrAdapter.IsErrorOr)
        {
            return await HandleErrorOrAsync(cacheable, next, cancellationToken);
        }

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
            await cacheKeyTracker.TrackAsync(tag, cacheKey, cancellationToken);

        return response;
    }

    private async Task<TResponse> HandleErrorOrAsync(
        ICacheable cacheable,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var originalKey = cacheable.CacheKey;
        var cacheKey = ErrorOrKeyPrefix + originalKey;

        var cachedValue = await ErrorOrAdapter.TryGetInnerAsync!(cache, cacheKey, cancellationToken);
        if (cachedValue.HasValue)
        {
            logger.LogDebug("[CACHE HIT] Key={CacheKey}", cacheKey);
            return ErrorOrAdapter.Wrap!(cachedValue.Value);
        }

        logger.LogDebug("[CACHE MISS] Key={CacheKey}", cacheKey);
        var response = await next();

        // Only cache successful results — caching ErrorOr.NotFound/Validation/etc would
        // strand stale errors past the underlying state changing.
        if (response is IErrorOr { IsError: false })
        {
            var entryOptions = new FusionCacheEntryOptions
            {
                Duration = cacheable.Expiration ?? TimeSpan.FromMinutes(5)
            };

            var inner = ErrorOrAdapter.Unwrap!(response);
            await ErrorOrAdapter.SetInnerAsync!(cache, cacheKey, inner, entryOptions, cancellationToken);

            // Track the prefixed key against the original tag (extracted from the
            // un-prefixed key) so CacheInvalidationBehavior keeps invalidating by
            // domain (e.g. "Tour", "TourInstance") without needing to know the prefix.
            var tag = ExtractTag(originalKey);
            if (tag is not null)
                await cacheKeyTracker.TrackAsync(tag, cacheKey, cancellationToken);
        }

        return response;
    }

    private static string? ExtractTag(string cacheKey)
    {
        var colonIndex = cacheKey.IndexOf(':');
        return colonIndex > 0 ? cacheKey[..colonIndex] : null;
    }

    // Compiled once per closed generic TResponse — reflection cost paid at first use only.
    private static class ErrorOrAdapter
    {
        public static readonly bool IsErrorOr;
        public static readonly Func<object?, TResponse>? Wrap;
        public static readonly Func<TResponse, object?>? Unwrap;
        public static readonly Func<IFusionCache, string, CancellationToken, ValueTask<CachedInner>>? TryGetInnerAsync;
        public static readonly Func<IFusionCache, string, object?, FusionCacheEntryOptions, CancellationToken, ValueTask>? SetInnerAsync;

        static ErrorOrAdapter()
        {
            var responseType = typeof(TResponse);
            if (!responseType.IsGenericType || responseType.GetGenericTypeDefinition() != typeof(ErrorOr<>))
                return;

            IsErrorOr = true;
            var innerType = responseType.GetGenericArguments()[0];

            Wrap = BuildWrap(responseType, innerType);
            Unwrap = BuildUnwrap(responseType, innerType);
            TryGetInnerAsync = BuildTryGet(innerType);
            SetInnerAsync = BuildSet(innerType);
        }

        private static Func<object?, TResponse> BuildWrap(Type responseType, Type innerType)
        {
            var implicitOp = responseType
                .GetMethods(BindingFlags.Static | BindingFlags.Public)
                .First(m => m.Name == "op_Implicit"
                            && m.ReturnType == responseType
                            && m.GetParameters()[0].ParameterType == innerType);

            var param = Expression.Parameter(typeof(object), "value");
            var casted = Expression.Convert(param, innerType);
            var wrapped = Expression.Call(implicitOp, casted);
            return Expression.Lambda<Func<object?, TResponse>>(wrapped, param).Compile();
        }

        private static Func<TResponse, object?> BuildUnwrap(Type responseType, Type innerType)
        {
            var valueProp = responseType.GetProperty("Value", BindingFlags.Instance | BindingFlags.Public)!;
            var param = Expression.Parameter(responseType, "response");
            var get = Expression.Property(param, valueProp);
            var asObject = Expression.Convert(get, typeof(object));
            return Expression.Lambda<Func<TResponse, object?>>(asObject, param).Compile();
        }

        // Builds: (cache, key, ct) => { var m = await cache.TryGetAsync<TInner>(key, null, ct); return new CachedInner(m.HasValue, m.Value); }
        private static Func<IFusionCache, string, CancellationToken, ValueTask<CachedInner>> BuildTryGet(Type innerType)
        {
            var helper = typeof(ErrorOrAdapter)
                .GetMethod(nameof(TryGetGeneric), BindingFlags.NonPublic | BindingFlags.Static)!
                .MakeGenericMethod(innerType);

            var cacheParam = Expression.Parameter(typeof(IFusionCache), "cache");
            var keyParam = Expression.Parameter(typeof(string), "key");
            var ctParam = Expression.Parameter(typeof(CancellationToken), "ct");
            var call = Expression.Call(helper, cacheParam, keyParam, ctParam);
            return Expression.Lambda<Func<IFusionCache, string, CancellationToken, ValueTask<CachedInner>>>(
                call, cacheParam, keyParam, ctParam).Compile();
        }

        private static Func<IFusionCache, string, object?, FusionCacheEntryOptions, CancellationToken, ValueTask> BuildSet(Type innerType)
        {
            var helper = typeof(ErrorOrAdapter)
                .GetMethod(nameof(SetGeneric), BindingFlags.NonPublic | BindingFlags.Static)!
                .MakeGenericMethod(innerType);

            var cacheParam = Expression.Parameter(typeof(IFusionCache), "cache");
            var keyParam = Expression.Parameter(typeof(string), "key");
            var valueParam = Expression.Parameter(typeof(object), "value");
            var optsParam = Expression.Parameter(typeof(FusionCacheEntryOptions), "opts");
            var ctParam = Expression.Parameter(typeof(CancellationToken), "ct");
            var call = Expression.Call(helper, cacheParam, keyParam, valueParam, optsParam, ctParam);
            return Expression.Lambda<Func<IFusionCache, string, object?, FusionCacheEntryOptions, CancellationToken, ValueTask>>(
                call, cacheParam, keyParam, valueParam, optsParam, ctParam).Compile();
        }

        private static async ValueTask<CachedInner> TryGetGeneric<TInner>(IFusionCache cache, string key, CancellationToken ct)
        {
            var maybe = await cache.TryGetAsync<TInner>(key, token: ct);
            return maybe.HasValue ? new CachedInner(true, maybe.Value) : new CachedInner(false, null);
        }

        private static async ValueTask SetGeneric<TInner>(IFusionCache cache, string key, object? value, FusionCacheEntryOptions opts, CancellationToken ct)
        {
            await cache.SetAsync(key, (TInner)value!, opts, token: ct);
        }
    }

    private readonly record struct CachedInner(bool HasValue, object? Value);
}
