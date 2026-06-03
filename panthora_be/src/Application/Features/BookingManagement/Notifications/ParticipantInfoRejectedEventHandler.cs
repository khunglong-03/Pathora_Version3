using System.Text.Encodings.Web;
using Domain.Common.Repositories;
using Domain.Events;
using Domain.Mails;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Application.Features.BookingManagement.Notifications;

public sealed class ParticipantInfoRejectedEventHandler(
    IMailRepository mailRepository,
    IConfiguration configuration,
    ILogger<ParticipantInfoRejectedEventHandler> logger)
    : INotificationHandler<ParticipantInfoRejectedEvent>
{
    public async Task Handle(ParticipantInfoRejectedEvent notification, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(notification.CustomerEmail))
        {
            logger.LogWarning("Skip email notification for participant {ParticipantId} reject in booking {BookingId}: CustomerEmail is null or empty.", notification.ParticipantId, notification.BookingId);
            return;
        }

        try
        {
            var baseUrl = configuration["App:BaseUrl"];
            if (string.IsNullOrEmpty(baseUrl))
            {
                logger.LogWarning("App:BaseUrl config is missing or empty. Using empty string fallback.");
                baseUrl = "";
            }

            var hotlinePhone = configuration["Pathora:HotlinePhone"] ?? "1900-XXXX";
            var updateLink = $"{baseUrl}/bookings/{notification.BookingId}/participants#participant-{notification.ParticipantId}";

            // FIX XSS: HTML-encode the rejection reason
            var encodedReason = HtmlEncoder.Default.Encode(notification.RejectionReason);

            var mailDto = new ParticipantInfoRejectedMail(
                CustomerName: notification.CustomerName ?? "Quý khách",
                BookingCode: notification.BookingCode,
                ParticipantFullName: notification.ParticipantFullName,
                RejectionReason: encodedReason,
                UpdateLink: updateLink,
                HotlinePhone: hotlinePhone
            );

            var mailEntity = mailDto.ToMail(notification.CustomerEmail);
            
            // Replace placeholder in subject
            mailEntity.Subject = mailEntity.Subject.Replace("{booking_code}", notification.BookingCode);

            var result = await mailRepository.Add(mailEntity, cancellationToken);
            if (result.IsError)
            {
                logger.LogWarning("Failed to queue rejection mail for participant {ParticipantId} in booking {BookingId}. Error: {ErrorDescription}",
                    notification.ParticipantId, notification.BookingId, result.FirstError.Description);
            }
            else
            {
                logger.LogInformation("Successfully queued rejection mail for participant {ParticipantId} in booking {BookingId}",
                    notification.ParticipantId, notification.BookingId);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Exception while queueing rejection mail for participant {ParticipantId} in booking {BookingId}",
                notification.ParticipantId, notification.BookingId);
            // Do NOT throw — email failure should not rollback transaction
        }
    }
}
