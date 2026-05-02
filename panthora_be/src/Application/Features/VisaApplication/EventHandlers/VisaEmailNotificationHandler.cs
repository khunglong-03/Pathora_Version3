using Domain.Common.Repositories;
using Domain.Events;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.VisaApplication.EventHandlers;

public sealed class VisaEmailNotificationHandler(
    IVisaApplicationRepository visaApplicationRepository,
    ILogger<VisaEmailNotificationHandler> logger)
    : INotificationHandler<VisaApplicationStatusChangedEvent>,
      INotificationHandler<VisaServiceFeeQuotedEvent>
{
    public async Task Handle(VisaApplicationStatusChangedEvent notification, CancellationToken cancellationToken)
    {
        var application = await visaApplicationRepository.GetByIdWithGraphAsync(notification.VisaApplicationId, cancellationToken);
        if (application == null)
            return;

        var email = application.BookingParticipant.Booking.User?.Email ?? application.BookingParticipant.Booking.CustomerEmail;
        if (string.IsNullOrEmpty(email))
            return;

        if (notification.NewStatus == Domain.Enums.VisaStatus.Approved)
        {
            logger.LogInformation(
                "MOCK EMAIL: Gửi email cho {Email}: Visa của hành khách {ParticipantName} đi {Country} đã được duyệt.",
                email,
                application.BookingParticipant.FullName,
                application.DestinationCountry);
        }
        else if (notification.NewStatus == Domain.Enums.VisaStatus.Rejected)
        {
            logger.LogInformation(
                "MOCK EMAIL: Gửi email cho {Email}: Visa của hành khách {ParticipantName} đi {Country} bị từ chối. Lý do: {Reason}. Vui lòng đăng nhập và nộp lại.",
                email,
                application.BookingParticipant.FullName,
                application.DestinationCountry,
                application.RefusalReason ?? "Không có lý do");
        }
    }

    public async Task Handle(VisaServiceFeeQuotedEvent notification, CancellationToken cancellationToken)
    {
        var application = await visaApplicationRepository.GetByIdWithGraphAsync(notification.VisaApplicationId, cancellationToken);
        if (application == null)
            return;

        var email = application.BookingParticipant.Booking.User?.Email ?? application.BookingParticipant.Booking.CustomerEmail;
        if (string.IsNullOrEmpty(email))
            return;

        logger.LogInformation(
            "MOCK EMAIL: Gửi email cho {Email}: Cần thanh toán phí hỗ trợ visa cho hành khách {ParticipantName}. Số tiền: {Fee:C0}. Vui lòng kiểm tra chi tiết Booking.",
            email,
            application.BookingParticipant.FullName,
            notification.Fee);
    }
}
