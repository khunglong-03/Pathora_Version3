using Domain.Entities;
using Domain.Enums;

namespace Domain.Common.Repositories;

public interface ITourRequestRepository
{
    Task AddAsync(TourRequestEntity entity, CancellationToken ct = default);
    Task UpdateAsync(TourRequestEntity entity);

    Task<TourRequestEntity?> GetByIdAsync(Guid id, bool asNoTracking = false, CancellationToken ct = default);
    Task<List<TourRequestEntity>> GetByUserIdAsync(Guid userId, int pageNumber = 1, int pageSize = 10, bool asNoTracking = false, CancellationToken ct = default);
    Task<int> CountByUserIdAsync(Guid userId, CancellationToken ct = default);

    Task<List<TourRequestEntity>> GetAllAsync(
        TourRequestStatus? status = null,
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null,
        string? searchText = null,
        int pageNumber = 1,
        int pageSize = 10,
        bool asNoTracking = false,
        CancellationToken ct = default);

    Task<int> CountAllAsync(
        TourRequestStatus? status = null,
        DateTimeOffset? fromDate = null,
        DateTimeOffset? toDate = null,
        string? searchText = null,
        CancellationToken ct = default);

    Task<List<TourRequestEntity>> GetByStatusAsync(TourRequestStatus status, CancellationToken ct = default);
    Task<int> CountByStatusAsync(TourRequestStatus status, CancellationToken ct = default);
}