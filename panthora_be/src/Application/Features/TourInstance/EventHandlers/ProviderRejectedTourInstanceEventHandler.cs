using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Domain.Events;
using Domain.Mails;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Application.Features.TourInstance.EventHandlers;

public sealed class ProviderRejectedTourInstanceEventHandler(
    ITourInstanceRepository tourInstanceRepository,
    IMailRepository mailRepository,
    IConfiguration configuration,
    ILogger<ProviderRejectedTourInstanceEventHandler> logger)
    : INotificationHandler<ProviderRejectedTourInstanceEvent>
{
    public async Task Handle(ProviderRejectedTourInstanceEvent notification, CancellationToken cancellationToken)
    {
        var instance = await tourInstanceRepository.FindByIdForRejectNotification(notification.TourInstanceId, cancellationToken);
        if (instance == null)
        {
            logger.LogWarning("ProviderRejectedTourInstanceEvent: TourInstance {TourInstanceId} not found.", notification.TourInstanceId);
            return;
        }

        string recipientEmail = "";
        string recipientName = "";

        if (instance.Tour?.TourOperator != null && !string.IsNullOrEmpty(instance.Tour.TourOperator.Email))
        {
            recipientEmail = instance.Tour.TourOperator.Email;
            recipientName = instance.Tour.TourOperator.FullName ?? "Tour Operator";
        }
        else
        {
            // Fallback to first manager (Role == Manager) ordered by CreatedOnUtc ASC
            var firstManager = instance.Managers
                .Where(m => m.Role == TourInstanceManagerRole.Manager && m.User != null && !string.IsNullOrEmpty(m.User.Email))
                .OrderBy(m => m.CreatedOnUtc)
                .FirstOrDefault();

            if (firstManager != null)
            {
                recipientEmail = firstManager.User!.Email!;
                recipientName = firstManager.User.FullName ?? "Manager";
                logger.LogWarning("Operator email is missing or empty. Falling back to Manager {ManagerEmail} for TourInstance {TourInstanceId}", recipientEmail, instance.Id);
            }
        }

        int managerCount = instance.Managers.Count(m => m.Role == TourInstanceManagerRole.Manager);

        if (string.IsNullOrEmpty(recipientEmail))
        {
            logger.LogWarning("ProviderRejection.NoRecipient: No recipient email found (Operator or Manager) for TourInstance {TourInstanceId}", instance.Id);
            return;
        }

        var baseUrl = configuration["App:BaseUrl"];
        if (string.IsNullOrEmpty(baseUrl))
        {
            logger.LogWarning("App:BaseUrl config is missing or empty. Using empty string fallback.");
            baseUrl = "";
        }

        var deepLink = $"{baseUrl}/tour-operator/tour-instances/{instance.Id}";
        var hotlinePhone = configuration["Pathora:HotlinePhone"] ?? "1900-XXXX";

        var activityLines = notification.Activities
            .Take(50)
            .Select(a => $"Ngày {a.DayNumber}: {a.Title}")
            .ToList();

        int overflowCount = Math.Max(0, notification.Activities.Count - 50);

        try
        {
            var mailDto = new ProviderRejectedTourInstanceMail(
                OperatorName: recipientName,
                SupplierName: notification.SupplierName,
                ProviderType: notification.ProviderType,
                TourCode: instance.TourCode,
                TourName: instance.TourName,
                StartDate: instance.StartDate.ToString("dd/MM/yyyy"),
                RejectionNote: notification.Note ?? "Không có ghi chú.",
                ActivityLines: activityLines,
                OverflowCount: overflowCount,
                DeepLink: deepLink,
                HotlinePhone: hotlinePhone
            );

            var mailEntity = mailDto.ToMail(recipientEmail);
            // Replace placeholder in subject
            mailEntity.Subject = mailEntity.Subject.Replace("{tour_code}", instance.TourCode);

            var addResult = await mailRepository.Add(mailEntity);
            if (addResult.IsError)
            {
                logger.LogWarning(
                    "ProviderRejectionEmailQueueFailed: TourInstanceId={TourInstanceId}, OperatorEmail={OperatorEmail}, ManagerEmailsCount={ManagerEmailsCount}, ActivityCount={ActivityCount}, ProviderType={ProviderType}, SupplierId={SupplierId}. Error: {ErrorDescription}",
                    instance.Id, recipientEmail, managerCount, notification.Activities.Count, notification.ProviderType, notification.SupplierId, addResult.FirstError.Description);
            }
            else
            {
                logger.LogInformation(
                    "ProviderRejectionEmailQueued: TourInstanceId={TourInstanceId}, OperatorEmail={OperatorEmail}, ManagerEmailsCount={ManagerEmailsCount}, ActivityCount={ActivityCount}, ProviderType={ProviderType}, SupplierId={SupplierId}",
                    instance.Id, recipientEmail, managerCount, notification.Activities.Count, notification.ProviderType, notification.SupplierId);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(
                ex,
                "ProviderRejectionEmailQueueFailed: TourInstanceId={TourInstanceId}, OperatorEmail={OperatorEmail}, ManagerEmailsCount={ManagerEmailsCount}, ActivityCount={ActivityCount}, ProviderType={ProviderType}, SupplierId={SupplierId}. Error: {ErrorMessage}",
                instance.Id, recipientEmail, managerCount, notification.Activities.Count, notification.ProviderType, notification.SupplierId, ex.Message);
        }
    }
}
