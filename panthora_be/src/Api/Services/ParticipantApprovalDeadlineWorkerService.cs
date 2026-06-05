using Application.Features.BookingApprovalDeadline;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Api.Services;

/// <summary>
/// Periodically warns and cancels bookings that missed passenger info or visa approval before the deadline (T-1 day).
/// Runs every 15 minutes.
/// </summary>
public sealed class ParticipantApprovalDeadlineWorkerService(
    IServiceProvider serviceProvider,
    ILogger<ParticipantApprovalDeadlineWorkerService> logger)
    : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);
    private Timer? _timer;

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation(
            "Participant approval deadline worker starting — interval {Minutes}m",
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
            var processor = scope.ServiceProvider.GetRequiredService<ParticipantApprovalDeadlineProcessor>();

            var warningsCount = await processor.SendWarningsAsync(DateTimeOffset.UtcNow, stoppingToken);
            if (warningsCount > 0)
                logger.LogInformation("Participant approval deadline warning sweep: sent {Count} email(s).", warningsCount);

            var cancelledCount = await processor.AutoCancelExpiredAsync(DateTimeOffset.UtcNow, stoppingToken);
            if (cancelledCount > 0)
                logger.LogInformation("Participant approval deadline auto-cancel sweep: cancelled {Count} booking(s).", cancelledCount);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Participant approval deadline sweep failed");
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        _timer?.Dispose();
        await base.StopAsync(cancellationToken);
        logger.LogInformation("Participant approval deadline worker stopped");
    }
}
