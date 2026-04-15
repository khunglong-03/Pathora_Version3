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
}
