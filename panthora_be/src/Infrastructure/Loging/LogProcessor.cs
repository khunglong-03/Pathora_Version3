using Domain.Constant;
using Infrastructure.Data;
using Infrastructure.Options;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace Infrastructure.Loging;

internal class LogProcessor(LogQueue queue, IServiceScopeFactory scopeFactory, IOptions<LoggingOptions> options) : BackgroundService
{
    private readonly LoggingOptions _options = options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var batch = new List<LogError>();

        while (!stoppingToken.IsCancellationRequested)
        {
            while (queue.Reader.TryRead(out var log))
            {
                batch.Add(log);
                if (batch.Count >= _options.LogBatchSize) break;
            }

            if (batch.Any())
            {
                using (var scope = scopeFactory.CreateScope())
                {
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    await db.Set<LogError>().AddRangeAsync(batch);
                    await db.SaveChangesAsync(stoppingToken);
                }
                batch.Clear();
            }
            await Task.Delay(_options.LogFlushDelayMs, stoppingToken);
        }
    }
}
