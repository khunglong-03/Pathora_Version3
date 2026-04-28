using StackExchange.Redis;

namespace Api.Middleware;

public class StartupCacheClearMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<StartupCacheClearMiddleware> _logger;
    private static bool _hasClearedCache = false;
    private static readonly object _lock = new object();

    public StartupCacheClearMiddleware(RequestDelegate next, ILogger<StartupCacheClearMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IServiceProvider serviceProvider)
    {
        if (!_hasClearedCache)
        {
            lock (_lock)
            {
                if (!_hasClearedCache)
                {
                    try
                    {
                        var multiplexer = serviceProvider.GetService<IConnectionMultiplexer>();
                        if (multiplexer != null)
                        {
                            var db = multiplexer.GetDatabase();
                            // Scan and delete all keys matching the app pattern (no admin needed)
                            var endpoints = multiplexer.GetEndPoints();
                            int totalDeleted = 0;
                            foreach (var endpoint in endpoints)
                            {
                                var server = multiplexer.GetServer(endpoint);
                                if (server.IsReplica) continue;

                                try
                                {
                                    // Attempt FlushDatabase first (only works if allowAdmin=true)
                                    server.FlushDatabase();
                                    totalDeleted = -1; // flag: flushed whole DB
                                    break;
                                }
                                catch (RedisCommandException)
                                {
                                    // Admin mode not enabled — fall back to scan-delete
                                    var keys = server.Keys(pattern: "*", pageSize: 250);
                                    var batch = new List<RedisKey>(250);
                                    foreach (var key in keys)
                                    {
                                        batch.Add(key);
                                        if (batch.Count >= 250)
                                        {
                                            totalDeleted += (int)db.KeyDelete([.. batch]);
                                            batch.Clear();
                                        }
                                    }
                                    if (batch.Count > 0)
                                        totalDeleted += (int)db.KeyDelete([.. batch]);
                                }
                            }

                            if (totalDeleted == -1)
                                _logger.LogInformation("Startup: Redis cache flushed (admin mode).");
                            else
                                _logger.LogInformation("Startup: Redis cache cleared via scan — {Count} key(s) removed.", totalDeleted);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Startup: Error clearing Redis cache.");
                    }
                    finally
                    {
                        _hasClearedCache = true;
                    }
                }
            }
        }

        await _next(context);
    }
}
