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
}
