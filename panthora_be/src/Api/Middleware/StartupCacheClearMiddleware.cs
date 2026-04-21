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
                            var endpoints = multiplexer.GetEndPoints();
                            foreach (var endpoint in endpoints)
                            {
                                var server = multiplexer.GetServer(endpoint);
                                if (!server.IsReplica)
                                {
                                    server.FlushDatabase();
                                }
                            }
                            _logger.LogInformation("Startup: Redis cache cleared successfully on first request.");
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
