using Application.Common;
using Application.Common.Behaviors;
using Domain.Common.Repositories;
using Domain.Events;
using Domain.Mails;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ZiggyCreatures.Caching.Fusion;

namespace Application.Features.BookingApprovalDeadline;

public sealed class BookingAutoCancelledForNonApprovalEventHandler(
    IRoomBlockRepository roomBlockRepository,
    IVehicleBlockRepository vehicleBlockRepository,
    IMailRepository mailRepository,
    IFusionCache cache,
    CacheKeyTracker cacheKeyTracker,
    IBookingRepository bookingRepository,
    IConfiguration configuration,
    ILogger<BookingAutoCancelledForNonApprovalEventHandler> logger)
    : INotificationHandler<BookingAutoCancelledForNonApprovalEvent>
{
    public async Task Handle(BookingAutoCancelledForNonApprovalEvent notification, CancellationToken cancellationToken)
    {
        logger.LogInformation("Processing auto-cancel blocks and mail for booking {BookingId}", notification.BookingId);

        // 1. Delete RoomBlocks
        try
        {
            await roomBlockRepository.DeleteByBookingAsync(notification.BookingId, cancellationToken);
            logger.LogInformation("Room blocks deleted for booking {BookingId}", notification.BookingId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to delete room blocks for booking {BookingId}", notification.BookingId);
        }

        // 2. Delete VehicleBlocks
        try
        {
            await vehicleBlockRepository.DeleteByBookingAsync(notification.BookingId, cancellationToken);
            logger.LogInformation("Vehicle blocks deleted for booking {BookingId}", notification.BookingId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to delete vehicle blocks for booking {BookingId}", notification.BookingId);
        }

        // 3. Load fresh booking details
        var booking = await bookingRepository.GetByIdWithDetailsAsync(notification.BookingId, cancellationToken);
        if (booking is null)
        {
            logger.LogWarning("Booking {BookingId} not found when trying to send cancellation email", notification.BookingId);
            return;
        }

        // 4. Send email
        if (!string.IsNullOrWhiteSpace(booking.CustomerEmail))
        {
            try
            {
                var hotline = configuration["Pathora:HotlinePhone"] ?? "1900-XXXX";
                var cancelReasonText = "Quá hạn phê duyệt thông tin hoặc hồ sơ visa hành khách.";

                var mailModel = BookingAutoCancelledNoRefundMail.Compose(booking, hotline, cancelReasonText);
                var mailEntity = mailModel.ToMail(booking.CustomerEmail);

                await mailRepository.Add(mailEntity, cancellationToken);
                logger.LogInformation("Scheduled auto-cancelled email for booking {BookingId}", notification.BookingId);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to queue auto-cancelled email for booking {BookingId}", notification.BookingId);
            }
        }

        // 5. Invalidate cache
        try
        {
            var keys = await cacheKeyTracker.GetKeysAsync(CacheKey.Booking, cancellationToken);
            foreach (var key in keys)
            {
                await cache.RemoveAsync(key, token: cancellationToken);
            }
            await cacheKeyTracker.RemoveKeysAsync(CacheKey.Booking, cancellationToken);
            logger.LogInformation("Cache invalidated for booking {BookingId}", notification.BookingId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to invalidate cache for booking {BookingId}", notification.BookingId);
        }
    }
}
