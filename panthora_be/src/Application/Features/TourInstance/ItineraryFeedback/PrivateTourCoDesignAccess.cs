using Domain.Entities;
using Domain.Enums;

namespace Application.Features.TourInstance.ItineraryFeedback;

internal static class PrivateTourCoDesignAccess
{
    [Obsolete("Use EnsureInstanceManagerOnly or EnsureInstanceOperatorOnly instead for private co-design.")]
    public static bool IsInstanceManager(TourInstanceEntity instance, Guid userId) =>
        instance.Managers.Exists(m => m.UserId == userId) ||
        (instance.Tour != null && instance.Tour.TourOperatorId == userId);

    public static bool EnsureInstanceManagerOnly(TourInstanceEntity instance, Guid userId) =>
        instance.Managers.Exists(m => m.UserId == userId);

    public static bool EnsureInstanceOperatorOnly(TourInstanceEntity instance, Guid userId) =>
        instance.Tour != null && instance.Tour.TourOperatorId == userId;

    public static bool DayBelongsToInstance(TourInstanceEntity instance, Guid dayId) =>
        instance.InstanceDays.Exists(d => d.Id == dayId);
}
