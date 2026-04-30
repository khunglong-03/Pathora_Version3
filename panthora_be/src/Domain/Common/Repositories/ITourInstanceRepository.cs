using Domain.Entities;
using Domain.Enums;

namespace Domain.Common.Repositories;

public interface ITourInstanceRepository
{
    Task<TourInstanceEntity?> FindById(Guid id, bool asNoTracking = false, CancellationToken cancellationToken = default);
    Task<List<TourInstanceEntity>> FindByIds(IEnumerable<Guid> ids, CancellationToken cancellationToken = default);
    Task<TourInstanceEntity?> FindByIdWithInstanceDays(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Tracked graph for commands that mutate activities (e.g. transport assignments).</summary>
    Task<TourInstanceEntity?> FindByIdWithInstanceDaysForUpdate(Guid id, CancellationToken cancellationToken = default);
    Task<TourInstanceDayEntity?> FindInstanceDayById(Guid instanceId, Guid dayId, CancellationToken cancellationToken = default);
    Task<TourDayActivityEntity?> FindTourDayActivityById(Guid tourDayId, Guid activityId, CancellationToken cancellationToken = default);
    Task UpdateInstanceDay(TourInstanceDayEntity day, CancellationToken cancellationToken = default);
    Task AddDay(TourInstanceDayEntity day, CancellationToken cancellationToken = default);
    Task UpdateTourDayActivity(TourDayActivityEntity activity, CancellationToken cancellationToken = default);
    Task<List<TourInstanceEntity>> FindAll(string? searchText, TourInstanceStatus? status, int pageNumber, int pageSize, bool excludePast = false, bool? wantsCustomization = null, Guid? principalId = null, CancellationToken cancellationToken = default);
    Task<int> CountAll(string? searchText, TourInstanceStatus? status, bool excludePast = false, bool? wantsCustomization = null, Guid? principalId = null, CancellationToken cancellationToken = default);
    Task Create(TourInstanceEntity tourInstance, CancellationToken cancellationToken = default);
    Task Update(TourInstanceEntity tourInstance, CancellationToken cancellationToken = default);
    Task SoftDelete(Guid id, CancellationToken cancellationToken = default);
    Task<(int Total, int Available, int Confirmed, int SoldOut, int Completed)> GetStats(CancellationToken cancellationToken = default);
    Task<List<TourInstanceEntity>> FindPublicAvailable(string? destination, string? sortBy, int page, int pageSize, TourType? catalogInstanceType = null, CancellationToken cancellationToken = default);
    Task<int> CountPublicAvailable(string? destination, TourType? catalogInstanceType = null, CancellationToken cancellationToken = default);
    Task<TourInstanceEntity?> FindPublicById(Guid id, CancellationToken cancellationToken = default);
    Task<List<TourInstanceEntity>> FindDuplicate(Guid tourId, Guid classificationId, DateTimeOffset startDate, CancellationToken cancellationToken = default);
    Task<List<TourInstanceEntity>> FindProviderAssigned(IEnumerable<Guid> providerIds, int pageNumber, int pageSize, ProviderApprovalStatus? approvalStatus = null, CancellationToken cancellationToken = default);
    Task<int> CountProviderAssigned(IEnumerable<Guid> providerIds, ProviderApprovalStatus? approvalStatus = null, CancellationToken cancellationToken = default);
    Task<List<TourInstanceEntity>> FindByManagerUserIds(IEnumerable<Guid> userIds, CancellationToken cancellationToken = default);
    Task<List<TourInstanceEntity>> FindConflictingInstancesForManagers(IEnumerable<Guid> userIds, DateTimeOffset startDate, DateTimeOffset endDate, Guid? excludeInstanceId = null, CancellationToken cancellationToken = default);

    Task<int> CountByGuideUserId(Guid userId, CancellationToken cancellationToken = default);
    Task<List<TourInstanceEntity>> FindByGuideUserId(Guid userId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<bool> HasGuideAssignmentAsync(Guid tourInstanceId, Guid userId, CancellationToken cancellationToken = default);
    Task<UserEntity?> FindUserByIdAsync(Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lightweight lookup for a TourInstanceDayActivity by ID. Used for IDOR validation
    /// in vehicle availability queries (excludeActivityId ownership check).
    /// </summary>
    Task<TourInstanceDayActivityEntity?> FindActivityByIdAsync(Guid activityId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Private tours in <see cref="TourInstanceStatus.PendingAdjustment"/> whose
    /// <see cref="TourInstanceEntity.ConfirmationDeadline"/> is before <paramref name="nowUtc"/> (task §6 worker).
    /// Includes bookings and payment transactions for mutation.
    /// </summary>
    Task<List<TourInstanceEntity>> ListPrivateInstancesPendingTopUpPastDeadlineAsync(
        DateTimeOffset nowUtc,
        CancellationToken cancellationToken = default);
}
