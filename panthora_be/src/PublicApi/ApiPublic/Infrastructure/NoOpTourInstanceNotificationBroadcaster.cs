using Application.Services;
using Domain.Enums;

namespace ApiPublic.Infrastructure;

public class NoOpTourInstanceNotificationBroadcaster : ITourInstanceNotificationBroadcaster
{
    public Task NotifyProviderAssignmentAsync(Guid tourInstanceId, string title, string tourName, DateTimeOffset startDate, DateTimeOffset endDate, string approvalType, Guid targetUserId, CancellationToken ct = default) => Task.CompletedTask;
    public Task NotifyProviderApprovalResultAsync(Guid tourInstanceId, string providerName, bool isApproved, string? reason, string targetManagerUserId, CancellationToken ct = default) => Task.CompletedTask;
    public Task NotifyTourInstanceStatusChangeAsync(Guid tourInstanceId, TourInstanceStatus newStatus, CancellationToken ct = default) => Task.CompletedTask;
    public Task NotifyProviderAssignedAsync(Guid supplierId, Guid activityId, Guid tourInstanceId, CancellationToken ct = default) => Task.CompletedTask;
    public Task NotifyProviderReleasedAsync(Guid oldSupplierId, Guid activityId, Guid tourInstanceId, string reason, CancellationToken ct = default) => Task.CompletedTask;
    public Task NotifyItineraryFeedbackEventAsync(Guid tourInstanceId, Guid feedbackId, string eventType, string targetUserGroup, string? reason = null, CancellationToken ct = default) => Task.CompletedTask;
    public Task NotifyManagerNewCustomRequestAsync(Guid tourInstanceId, string tourName, string customerName, Guid targetManagerUserId, CancellationToken ct = default) => Task.CompletedTask;
}
