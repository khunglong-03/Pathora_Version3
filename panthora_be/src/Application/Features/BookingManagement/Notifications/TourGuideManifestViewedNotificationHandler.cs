namespace Application.Features.BookingManagement.Notifications;

using System.Threading;
using System.Threading.Tasks;
using Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

public sealed class TourGuideManifestViewedNotificationHandler(
    ILogger<TourGuideManifestViewedNotificationHandler> logger)
    : INotificationHandler<TourGuideManifestViewedEvent>
{
    public Task Handle(TourGuideManifestViewedEvent notification, CancellationToken cancellationToken)
    {
        // Ghi vào Audit Log (tạm thời ghi log hệ thống cho đến khi có ManifestAccessLogEntity)
        logger.LogInformation(
            "TourGuideManifest viewed. GuideUserId: {GuideUserId}, TourInstanceId: {TourInstanceId}, ViewedAt: {ViewedAt}, TotalBookings: {TotalBookings}",
            notification.GuideUserId,
            notification.TourInstanceId,
            notification.ViewedAt,
            notification.BookingIds.Count);

        return Task.CompletedTask;
    }
}
