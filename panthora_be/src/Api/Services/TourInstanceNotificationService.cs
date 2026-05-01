using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

using Api.Hubs;
using Application.Services;
using Domain.Enums;

namespace Api.Services;

public sealed class TourInstanceNotificationService(
    IHubContext<NotificationsHub> hubContext,
    ILogger<TourInstanceNotificationService> logger)
    : ITourInstanceNotificationBroadcaster
{
    private readonly IHubContext<NotificationsHub> _hubContext = hubContext;
    private readonly ILogger<TourInstanceNotificationService> _logger = logger;

    public async Task NotifyProviderAssignmentAsync(
        Guid tourInstanceId,
        string title,
        string tourName,
        DateTimeOffset startDate,
        DateTimeOffset endDate,
        string approvalType,
        Guid targetUserId,
        CancellationToken ct = default)
    {
        var payload = new
        {
            TourInstanceId = tourInstanceId,
            Title = title,
            TourName = tourName,
            StartDate = startDate,
            EndDate = endDate,
            ApprovalType = approvalType
        };

        await _hubContext.Clients
            .Group($"user:{targetUserId}")
            .SendAsync("ReceiveProviderAssignment", payload, ct);

        _logger.LogDebug(
            "Provider assignment notification sent to user {UserId} for TourInstance {TourInstanceId} (type: {ApprovalType})",
            targetUserId, tourInstanceId, approvalType);
    }

    public async Task NotifyProviderApprovalResultAsync(
        Guid tourInstanceId,
        string providerName,
        bool isApproved,
        string? reason,
        string targetManagerUserId,
        CancellationToken ct = default)
    {
        var payload = new
        {
            TourInstanceId = tourInstanceId,
            ProviderName = providerName,
            Result = isApproved ? "Approved" : "Rejected",
            Reason = reason
        };

        // Notify the creating manager
        await _hubContext.Clients
            .Group($"user:{targetManagerUserId}")
            .SendAsync("ReceiveProviderApprovalResult", payload, ct);

        // Notify all admins
        await _hubContext.Clients
            .Group("admins")
            .SendAsync("ReceiveProviderApprovalResult", payload, ct);

        _logger.LogDebug(
            "Provider approval result ({Result}) sent to user {UserId} and admins for TourInstance {TourInstanceId}",
            payload.Result, targetManagerUserId, tourInstanceId);
    }

    public async Task NotifyTourInstanceStatusChangeAsync(
        Guid tourInstanceId,
        TourInstanceStatus newStatus,
        CancellationToken ct = default)
    {
        var payload = new
        {
            TourInstanceId = tourInstanceId,
            NewStatus = newStatus.ToString()
        };

        await _hubContext.Clients
            .Group("admins")
            .SendAsync("ReceiveTourInstanceUpdate", payload, ct);

        _logger.LogDebug(
            "TourInstance status change to {NewStatus} sent to admins for TourInstance {TourInstanceId}",
            newStatus, tourInstanceId);
    }

    public async Task NotifyProviderAssignedAsync(
        Guid supplierId,
        Guid activityId,
        Guid tourInstanceId,
        CancellationToken ct = default)
    {
        var payload = new
        {
            SupplierId = supplierId,
            ActivityId = activityId,
            TourInstanceId = tourInstanceId,
            Event = "Assigned"
        };

        await _hubContext.Clients
            .Group($"supplier:{supplierId}")
            .SendAsync("ReceiveSupplierAssignmentEvent", payload, ct);

        _logger.LogDebug(
            "Supplier assigned notification sent to supplier {SupplierId} for activity {ActivityId} of TourInstance {TourInstanceId}",
            supplierId, activityId, tourInstanceId);
    }

    public async Task NotifyProviderReleasedAsync(
        Guid oldSupplierId,
        Guid activityId,
        Guid tourInstanceId,
        string reason,
        CancellationToken ct = default)
    {
        var payload = new
        {
            SupplierId = oldSupplierId,
            ActivityId = activityId,
            TourInstanceId = tourInstanceId,
            Reason = reason,
            Event = "Released"
        };

        await _hubContext.Clients
            .Group($"supplier:{oldSupplierId}")
            .SendAsync("ReceiveSupplierAssignmentEvent", payload, ct);

        _logger.LogDebug(
            "Supplier released notification sent to supplier {SupplierId} for activity {ActivityId} of TourInstance {TourInstanceId} (reason: {Reason})",
            oldSupplierId, activityId, tourInstanceId, reason);
    }

    public async Task NotifyItineraryFeedbackEventAsync(
        Guid tourInstanceId,
        Guid feedbackId,
        string eventType,
        string targetUserGroup,
        string? reason = null,
        CancellationToken ct = default)
    {
        var payload = new
        {
            TourInstanceId = tourInstanceId,
            FeedbackId = feedbackId,
            Event = eventType,
            Reason = reason
        };

        await _hubContext.Clients
            .Group(targetUserGroup)
            .SendAsync("ReceiveItineraryFeedbackEvent", payload, ct);

        _logger.LogDebug(
            "Itinerary feedback event ({Event}) sent to {TargetGroup} for TourInstance {TourInstanceId}, Feedback {FeedbackId}",
            eventType, targetUserGroup, tourInstanceId, feedbackId);
    }

    public async Task NotifyManagerNewCustomRequestAsync(
        Guid tourInstanceId,
        string tourName,
        string customerName,
        Guid targetManagerUserId,
        CancellationToken ct = default)
    {
        var payload = new
        {
            TourInstanceId = tourInstanceId,
            TourName = tourName,
            CustomerName = customerName,
            Event = "NewCustomTourRequest"
        };

        await _hubContext.Clients
            .Group($"user:{targetManagerUserId}")
            .SendAsync("ReceiveCustomTourRequest", payload, ct);

        _logger.LogDebug(
            "New custom tour request notification sent to user {UserId} for TourInstance {TourInstanceId}",
            targetManagerUserId, tourInstanceId);
    }
}
