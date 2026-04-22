using Domain.Enums;

namespace Application.Services;

/// <summary>
/// Interface for broadcasting TourInstance-related notifications.
/// Implemented in Api layer to avoid Application -> Infrastructure dependency.
/// </summary>
public interface ITourInstanceNotificationBroadcaster
{
    Task NotifyProviderAssignmentAsync(
        Guid tourInstanceId,
        string title,
        string tourName,
        DateTimeOffset startDate,
        DateTimeOffset endDate,
        string approvalType,
        Guid targetUserId,
        CancellationToken ct = default);

    Task NotifyProviderApprovalResultAsync(
        Guid tourInstanceId,
        string providerName,
        bool isApproved,
        string? reason,
        string targetManagerUserId,
        CancellationToken ct = default);

    Task NotifyTourInstanceStatusChangeAsync(
        Guid tourInstanceId,
        TourInstanceStatus newStatus,
        CancellationToken ct = default);

    /// <summary>
    /// ER-13: a supplier has just been assigned (newly or after a change) to an activity.
    /// Broadcasts to the <c>supplier:{supplierId}</c> group so owner dashboards refresh.
    /// </summary>
    Task NotifyProviderAssignedAsync(
        Guid supplierId,
        Guid activityId,
        Guid tourInstanceId,
        CancellationToken ct = default);

    /// <summary>
    /// ER-13: a supplier has just been released — either because the Manager picked a
    /// different supplier, or because the activity was removed/cancelled.
    /// </summary>
    Task NotifyProviderReleasedAsync(
        Guid oldSupplierId,
        Guid activityId,
        Guid tourInstanceId,
        string reason,
        CancellationToken ct = default);
}
