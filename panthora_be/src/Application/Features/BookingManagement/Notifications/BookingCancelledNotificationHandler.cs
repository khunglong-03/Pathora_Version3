using Domain.Common.Repositories;
using Domain.Enums;
using Domain.Events;
using Domain.Mails;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.BookingManagement.Notifications;

/// <summary>
/// Gửi email thông báo cho customer khi booking flip sang Cancelled do tour bị huỷ.
/// Skip silent nếu CustomerEmail null. Catch + log warning nếu mail send fail.
/// </summary>
public sealed class BookingCancelledNotificationHandler(
    IMailRepository mailRepository,
    IBookingRepository bookingRepository,
    ILogger<BookingCancelledNotificationHandler> logger)
    : INotificationHandler<BookingStatusChangedEvent>
{
    public async Task Handle(BookingStatusChangedEvent notification, CancellationToken cancellationToken)
    {
        if (notification.NewStatus != BookingStatus.Cancelled)
            return;

        // Skip customer-initiated cancellation flow (already has its own email handler)
        if (notification.PerformedBy == "CUSTOMER" || notification.PerformedBy == "SYSTEM" || notification.OldStatus == BookingStatus.PendingCancellation)
            return;

        var booking = await bookingRepository.GetByIdWithDetailsAsync(notification.BookingId, cancellationToken);
        if (booking is null)
            return;

        if (string.IsNullOrWhiteSpace(booking.CustomerEmail))
        {
            logger.LogDebug("Skipping tour cancelled email for booking {BookingId} — no customer email", booking.Id);
            return;
        }

        try
        {
            var refundFormatted = booking.RefundOutstandingAmount.HasValue
                ? booking.RefundOutstandingAmount.Value.ToString("N0") + "₫"
                : "Liên hệ để biết chi tiết";

            var mailDto = new TourCancelledMail(
                CustomerName: booking.CustomerName ?? "Quý khách",
                BookingId: booking.Id.ToString(),
                TourName: booking.TourInstance?.TourName ?? "Tour",
                RefundOutstandingAmount: refundFormatted,
                HotlinePhone: "1900 xxxx");

            var mail = mailDto.ToMail(booking.CustomerEmail);
            await mailRepository.Add(mail, cancellationToken);

            logger.LogInformation("Scheduled tour cancelled email for booking {BookingId}", booking.Id);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to schedule tour cancelled email for booking {BookingId}", booking.Id);
            // Do NOT throw — email failure should not affect the main flow
        }
    }
}
