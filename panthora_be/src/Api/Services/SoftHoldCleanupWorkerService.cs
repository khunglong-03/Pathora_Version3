using Application.Common.Interfaces;
using Domain.Common.Repositories;
using Domain.Enums;
using Domain.UnitOfWork;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Api.Services;

public class SoftHoldCleanupWorkerService(
    IServiceProvider serviceProvider,
    ILogger<SoftHoldCleanupWorkerService> logger)
    : BackgroundService
{
    private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(10);
    private Timer? _timer;

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Soft-hold Cleanup Worker starting with interval {IntervalMinutes}m", CheckInterval.TotalMinutes);

        _timer = new Timer(
            _ => _ = CleanupExpiredHoldsAsync(stoppingToken),
            null,
            TimeSpan.FromSeconds(45), // Warmup
            CheckInterval);

        return Task.CompletedTask;
    }

    private async Task CleanupExpiredHoldsAsync(CancellationToken stoppingToken)
    {
        try
        {
            using var scope = serviceProvider.CreateScope();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
            var roomBlockRepo = scope.ServiceProvider.GetRequiredService<IRoomBlockRepository>();
            var vehicleBlockRepo = scope.ServiceProvider.GetRequiredService<IVehicleBlockRepository>();

            var now = DateTimeOffset.UtcNow;

            // 1. Cleanup Room Blocks
            var expiredRoomBlocks = await roomBlockRepo.GetListAsync(
                x => x.HoldStatus == HoldStatus.Soft && x.ExpiresAt < now);

            if (expiredRoomBlocks.Count > 0)
            {
                logger.LogInformation("Cleaning up {Count} expired soft room blocks", expiredRoomBlocks.Count);
                foreach (var block in expiredRoomBlocks)
                {
                    roomBlockRepo.Remove(block);
                }
            }

            // 2. Cleanup Vehicle Blocks
            var expiredVehicleBlocks = await vehicleBlockRepo.GetListAsync(
                x => x.HoldStatus == HoldStatus.Soft && x.ExpiresAt < now);

            if (expiredVehicleBlocks.Count > 0)
            {
                logger.LogInformation("Cleaning up {Count} expired soft vehicle blocks", expiredVehicleBlocks.Count);
                foreach (var block in expiredVehicleBlocks)
                {
                    vehicleBlockRepo.Remove(block);
                }
            }
            
            if (expiredRoomBlocks.Count > 0 || expiredVehicleBlocks.Count > 0)
            {
                await unitOfWork.SaveChangeAsync(stoppingToken);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during soft-hold cleanup");
        }
    }

    public override async Task StopAsync(CancellationToken stoppingToken)
    {
        _timer?.Dispose();
        await base.StopAsync(stoppingToken);
        logger.LogInformation("Soft-hold Cleanup Worker stopped");
    }
}
