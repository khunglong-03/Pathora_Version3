using Domain.Entities;
using Domain.Enums;

namespace Domain.Common.Repositories;

public interface ITourInstanceRepository
{
    Task<TourInstanceEntity?> FindById(Guid id, bool asNoTracking = false, CancellationToken cancellationToken = default);
    Task<List<TourInstanceEntity>> FindByIds(IEnumerable<Guid> ids, CancellationToken cancellationToken = default);
    Task<TourInstanceEntity?> FindByIdWithInstanceDays(Guid id, CancellationToken cancellationToken = default);
    Task<TourInstanceDayEntity?> FindInstanceDayById(Guid instanceId, Guid dayId, CancellationToken cancellationToken = default);
    Task<TourDayActivityEntity?> FindTourDayActivityById(Guid tourDayId, Guid activityId, CancellationToken cancellationToken = default);
    Task UpdateInstanceDay(TourInstanceDayEntity day, CancellationToken cancellationToken = default);
    Task AddDay(TourInstanceDayEntity day, CancellationToken cancellationToken = default);
    Task UpdateTourDayActivity(TourDayActivityEntity activity, CancellationToken cancellationToken = default);
    Task<List<TourInstanceEntity>> FindAll(string? searchText, TourInstanceStatus? status, int pageNumber, int pageSize, Guid? principalId = null, CancellationToken cancellationToken = default);
    Task<int> CountAll(string? searchText, TourInstanceStatus? status, Guid? principalId = null, CancellationToken cancellationToken = default);
    Task Create(TourInstanceEntity tourInstance, CancellationToken cancellationToken = default);
    Task Update(TourInstanceEntity tourInstance, CancellationToken cancellationToken = default);
    Task SoftDelete(Guid id, CancellationToken cancellationToken = default);
    Task<(int Total, int Available, int Confirmed, int SoldOut)> GetStats(CancellationToken cancellationToken = default);
    Task<List<TourInstanceEntity>> FindPublicAvailable(string? destination, string? sortBy, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<int> CountPublicAvailable(string? destination, CancellationToken cancellationToken = default);
    Task<TourInstanceEntity?> FindPublicById(Guid id, CancellationToken cancellationToken = default);
    Task<List<TourInstanceEntity>> FindDuplicate(Guid tourId, Guid classificationId, DateTimeOffset startDate, CancellationToken cancellationToken = default);
    Task<List<TourInstanceEntity>> FindProviderAssigned(Guid providerId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<int> CountProviderAssigned(Guid providerId, CancellationToken cancellationToken = default);
    Task<List<TourInstanceEntity>> FindByManagerUserIds(IEnumerable<Guid> userIds, CancellationToken cancellationToken = default);
}
