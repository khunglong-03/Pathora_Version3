using Application.Services.PrivateTour;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Api.Services;

/// <summary>
/// Periodically cancels private tour bookings that missed top-up before <c>TourInstance.ConfirmationDeadline</c> (OpenSpec §6).
/// No cancellation fees are applied in code — legal/accounting policy only.
/// </summary>
public sealed class PrivateTourTopUpDeadlineWorkerService(
    IServiceProvider serviceProvider,
    ILogger<PrivateTourTopUpDeadlineWorkerService> logger)
    : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);
    private Timer? _timer;

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation(
            "Private tour top-up deadline worker starting — interval {Minutes}m",
            Interval.TotalMinutes);

        _timer = new Timer(
            _ => _ = RunOnceSafeAsync(stoppingToken),
            null,
            TimeSpan.FromMinutes(1),
            Interval);

        return Task.CompletedTask;
    }

    private async Task RunOnceSafeAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var scope = serviceProvider.CreateScope();
            var processor = scope.ServiceProvider.GetRequiredService<PrivateTourTopUpDeadlineProcessor>();
            var n = await processor.ProcessExpiredConfirmationDeadlinesAsync(DateTimeOffset.UtcNow, stoppingToken);
            if (n > 0)
                logger.LogInformation("Private tour top-up deadline sweep: updated {Count} instance(s).", n);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Private tour top-up deadline sweep failed");
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _timer?.Dispose();
        await base.StopAsync(cancellationToken);
        logger.LogInformation("Private tour top-up deadline worker stopped");
    }
}
