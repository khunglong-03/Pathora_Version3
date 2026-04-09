using Domain.Entities;
using Domain.Enums;

namespace Domain.Common.Repositories;

public interface ITourInstanceRepository
{
    Task<TourInstanceEntity?> FindById(Guid id, bool asNoTracking = false);
    Task<List<TourInstanceEntity>> FindByIds(IEnumerable<Guid> ids);
    Task<TourInstanceEntity?> FindByIdWithInstanceDays(Guid id);
    Task<TourInstanceDayEntity?> FindInstanceDayById(Guid instanceId, Guid dayId);
    Task<TourDayActivityEntity?> FindTourDayActivityById(Guid tourDayId, Guid activityId);
    Task UpdateInstanceDay(TourInstanceDayEntity day);
    Task AddDay(TourInstanceDayEntity day);
    Task UpdateTourDayActivity(TourDayActivityEntity activity);
    Task<List<TourInstanceEntity>> FindAll(string? searchText, TourInstanceStatus? status, int pageNumber, int pageSize);
    Task<int> CountAll(string? searchText, TourInstanceStatus? status);
    Task Create(TourInstanceEntity tourInstance);
    Task Update(TourInstanceEntity tourInstance);
    Task SoftDelete(Guid id);
    Task<(int Total, int Available, int Confirmed, int SoldOut)> GetStats();
    Task<List<TourInstanceEntity>> FindPublicAvailable(string? destination, string? sortBy, int page, int pageSize);
    Task<int> CountPublicAvailable(string? destination);
    Task<TourInstanceEntity?> FindPublicById(Guid id);
    Task<List<TourInstanceEntity>> FindDuplicate(Guid tourId, Guid classificationId, DateTimeOffset startDate);
}
