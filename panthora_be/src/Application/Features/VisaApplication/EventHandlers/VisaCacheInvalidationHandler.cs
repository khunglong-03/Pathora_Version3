using Application.Common;
using Application.Common.Behaviors;
using Contracts.Interfaces;
using Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;
using ZiggyCreatures.Caching.Fusion;

namespace Application.Features.VisaApplication.EventHandlers;

public sealed class VisaCacheInvalidationHandler(
    IFusionCache cache,
    CacheKeyTracker cacheKeyTracker,
    ILogger<VisaCacheInvalidationHandler> logger)
    : INotificationHandler<VisaApplicationStatusChangedEvent>,
      INotificationHandler<VisaServiceFeeQuotedEvent>
{
    public async Task Handle(VisaApplicationStatusChangedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Invalidating cache for Visa Application {VisaApplicationId}", notification.VisaApplicationId);
        await InvalidateBookingCacheAsync(cancellationToken);
    }

    public async Task Handle(VisaServiceFeeQuotedEvent notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Invalidating cache for Visa Application {VisaApplicationId}", notification.VisaApplicationId);
        await InvalidateBookingCacheAsync(cancellationToken);
    }

    private async Task InvalidateBookingCacheAsync(CancellationToken cancellationToken)
    {
        // Invalidate booking related caches
        var keys = await cacheKeyTracker.GetKeysAsync(CacheKey.Booking, cancellationToken);
        foreach (var key in keys)
        {
            await cache.RemoveAsync(key, token: cancellationToken);
        }
        await cacheKeyTracker.RemoveKeysAsync(CacheKey.Booking, cancellationToken);
    }
}
