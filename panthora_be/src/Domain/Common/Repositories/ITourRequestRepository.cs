using Domain.Entities;
using Domain.Enums;

namespace Domain.Common.Repositories;

public interface ITourRequestRepository
{
    Task AddAsync(TourRequestEntity entity);
    Task UpdateAsync(TourRequestEntity entity);

    Task<TourRequestEntity?> GetByIdAsync(Guid id, bool asNoTracking = false);
    Task<List<TourRequestEntity>> GetByUserIdAsync(Guid userId, int pageNumber = 1, int pageSize = 10, bool asNoTracking = false);
    Task<int> CountByUserIdAsync(Guid userId);

    Task<List<TourRequestEntity>> GetAllAsync(
        TourRequestStatus? status = null,
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null,
        string? searchText = null,
        int pageNumber = 1,
        int pageSize = 10,
        bool asNoTracking = false);

    Task<int> CountAllAsync(
        TourRequestStatus? status = null,
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null,
        string? searchText = null);

    Task<List<TourRequestEntity>> GetByStatusAsync(TourRequestStatus status);
    Task<int> CountByStatusAsync(TourRequestStatus status);
}
