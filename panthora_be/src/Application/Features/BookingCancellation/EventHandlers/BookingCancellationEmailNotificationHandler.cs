using Domain.UnitOfWork;
using Domain.Common.Repositories;
using Domain.Events;
using Domain.Mails;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.BookingCancellation.EventHandlers;

public sealed class BookingCancellationEmailNotificationHandler(
    IMailRepository mailRepository,
    IBookingRepository bookingRepository,
    IBookingCancellationRequestRepository requestRepository,
    IUnitOfWork unitOfWork,
    ILogger<BookingCancellationEmailNotificationHandler> logger)
    : INotificationHandler<BookingCancellationRejectedEvent>,
      INotificationHandler<BookingCancellationApprovedEvent>
{
    public async Task Handle(BookingCancellationRejectedEvent notification, CancellationToken cancellationToken)
    {
        var booking = await bookingRepository.GetByIdWithDetailsAsync(notification.BookingId, cancellationToken);
        if (booking == null) return;

        var request = await requestRepository.GetPendingByBookingId(notification.BookingId, cancellationToken);
        // It might not be pending anymore, we should fetch the most recent rejected request.
        if (request == null)
        {
            var allRequests = await requestRepository.GetByBookingIdAsync(notification.BookingId, cancellationToken);
            request = allRequests.OrderByDescending(r => r.CreatedOnUtc).FirstOrDefault();
        }

        if (request == null || booking.CustomerEmail == null) return;

        var mailDto = new BookingCancellationRejectedMail(
            CustomerName: booking.CustomerName ?? "Quý khách",
            BookingId: booking.Id.ToString(),
            TourName: booking.TourInstance?.Tour?.TourName ?? "Tour",
            ManagerNote: request.ManagerNote ?? "Không có ghi chú");

        var mail = mailDto.ToMail(booking.CustomerEmail);

        await mailRepository.Add(mail, cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        logger.LogInformation("Scheduled cancellation rejected email for booking {BookingId}", booking.Id);
    }

    public async Task Handle(BookingCancellationApprovedEvent notification, CancellationToken cancellationToken)
    {
        var booking = await bookingRepository.GetByIdWithDetailsAsync(notification.BookingId, cancellationToken);
        if (booking == null || booking.CustomerEmail == null) return;

        var allRequests = await requestRepository.GetByBookingIdAsync(notification.BookingId, cancellationToken);
        var request = allRequests.OrderByDescending(r => r.CreatedOnUtc).FirstOrDefault();

        if (request == null) return;

        var refundFormatted = request.RefundAmount.ToString("N0") + "đ";

        var mailDto = new BookingCancellationApprovedMail(
            CustomerName: booking.CustomerName ?? "Quý khách",
            BookingId: booking.Id.ToString(),
            TourName: booking.TourInstance?.Tour?.TourName ?? "Tour",
            RefundAmount: refundFormatted);

        var mail = mailDto.ToMail(booking.CustomerEmail);

        await mailRepository.Add(mail, cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        logger.LogInformation("Scheduled cancellation approved email for booking {BookingId}", booking.Id);
    }
}
