using Domain.Entities;
using Domain.Enums;

namespace Application.Features.TourInstance.ItineraryFeedback;

internal static class PrivateTourCoDesignAccess
{
    public static bool IsInstanceManager(TourInstanceEntity instance, Guid userId) =>
        instance.Managers.Exists(m => m.UserId == userId);

    public static bool DayBelongsToInstance(TourInstanceEntity instance, Guid dayId) =>
        instance.InstanceDays.Exists(d => d.Id == dayId);
}
