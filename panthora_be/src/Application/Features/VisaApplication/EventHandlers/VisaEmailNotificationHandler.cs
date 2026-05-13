using Domain.Common.Repositories;
using Domain.Events;
using Domain.Mails;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Application.Features.VisaApplication.EventHandlers;

public sealed class VisaEmailNotificationHandler(
    IVisaApplicationRepository visaApplicationRepository,
    IMailRepository mailRepository,
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
        {
            logger.LogWarning("Cannot send visa notification: email is empty for Visa Application {VisaId}.", application.Id);
            return;
        }

        if (notification.NewStatus == Domain.Enums.VisaStatus.Approved)
        {
            try
            {
                var customerName = application.BookingParticipant.Booking.User?.FullName ?? "Customer";
                
                var approvedMail = new VisaApplicationApprovedMail(
                    CustomerName: customerName,
                    ParticipantName: application.BookingParticipant.FullName,
                    DestinationCountry: application.DestinationCountry,
                    ViewLink: "/bookings");

                var mail = approvedMail.ToMail(email);
                var addResult = await mailRepository.Add(mail);
                if (addResult.IsError)
                {
                    logger.LogWarning(
                        "Failed to queue VisaApplicationApprovedMail for Visa {VisaId}: {ErrorDescription}",
                        application.Id,
                        addResult.FirstError.Description);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to create VisaApplicationApprovedMail for Visa {VisaId}", application.Id);
            }
        }
        else if (notification.NewStatus == Domain.Enums.VisaStatus.Rejected)
        {
            try
            {
                var customerName = application.BookingParticipant.Booking.User?.FullName ?? "Customer";
                
                var rejectedMail = new VisaApplicationRejectedMail(
                    CustomerName: customerName,
                    ParticipantName: application.BookingParticipant.FullName,
                    DestinationCountry: application.DestinationCountry,
                    RefusalReason: application.RefusalReason ?? "Not specified.",
                    ResubmitLink: "/bookings"); // Assuming they manage visas from their bookings page

                var mail = rejectedMail.ToMail(email);
                var addResult = await mailRepository.Add(mail);
                if (addResult.IsError)
                {
                    logger.LogWarning(
                        "Failed to queue VisaApplicationRejectedMail for Visa {VisaId}: {ErrorDescription}",
                        application.Id,
                        addResult.FirstError.Description);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to create VisaApplicationRejectedMail for Visa {VisaId}", application.Id);
            }
        }
    }

    public async Task Handle(VisaServiceFeeQuotedEvent notification, CancellationToken cancellationToken)
    {
        var application = await visaApplicationRepository.GetByIdWithGraphAsync(notification.VisaApplicationId, cancellationToken);
        if (application == null)
            return;

        var email = application.BookingParticipant.Booking.User?.Email ?? application.BookingParticipant.Booking.CustomerEmail;
        if (string.IsNullOrEmpty(email))
        {
            logger.LogWarning("Cannot send visa notification: email is empty for Visa Application {VisaId}.", application.Id);
            return;
        }

        try
        {
            var customerName = application.BookingParticipant.Booking.User?.FullName ?? "Customer";
            var feeStr = notification.Fee.ToString("N0");
            
            var quoteMail = new VisaServiceFeeQuotedMail(
                CustomerName: customerName,
                ParticipantName: application.BookingParticipant.FullName,
                DestinationCountry: application.DestinationCountry,
                Fee: feeStr,
                PaymentLink: "/bookings"); // Link to booking to pay the fee

            var mail = quoteMail.ToMail(email);
            var addResult = await mailRepository.Add(mail);
            if (addResult.IsError)
            {
                logger.LogWarning(
                    "Failed to queue VisaServiceFeeQuotedMail for Visa {VisaId}: {ErrorDescription}",
                    application.Id,
                    addResult.FirstError.Description);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to create VisaServiceFeeQuotedMail for Visa {VisaId}", application.Id);
        }
    }
}
