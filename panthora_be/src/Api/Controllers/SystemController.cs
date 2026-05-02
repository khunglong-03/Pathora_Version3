using Microsoft.AspNetCore.Mvc;
using StackExchange.Redis;

namespace Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemController : ControllerBase
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SystemController> _logger;

    public SystemController(IServiceProvider serviceProvider, ILogger<SystemController> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    [HttpPost("clear-cache")]
    public IActionResult ClearCache()
    {
        try
        {
            var multiplexer = _serviceProvider.GetService<IConnectionMultiplexer>();
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
                _logger.LogInformation("Redis cache cleared successfully.");
                return Ok(new { message = "Redis cache cleared successfully." });
            }

            _logger.LogInformation("Redis multiplexer not found, using memory cache or Redis is disabled.");
            return Ok(new { message = "No Redis cache to clear." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing Redis cache.");
            return StatusCode(500, new { message = "Failed to clear cache", error = ex.Message });
        }
    }
}
