using Domain.Entities;
using Domain.Enums;

namespace Domain.Common.Repositories;

public interface ITourRepository
{
    Task<TourEntity?> FindById(Guid id, bool asNoTracking = false, CancellationToken cancellationToken = default);
    Task<TourEntity?> FindByIdForUpdate(Guid id, CancellationToken cancellationToken = default);
    Task<bool> ExistsByTourCode(string tourCode, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<List<TourEntity>> FindAll(string? searchText, int pageNumber, int pageSize, Guid? principalId = null, TourStatus? status = null, TourScope? tourScope = null, Continent? continent = null, CancellationToken cancellationToken = default);
    Task<int> CountAll(string? searchText, Guid? principalId = null, TourStatus? status = null, TourScope? tourScope = null, Continent? continent = null, CancellationToken cancellationToken = default);
    Task<List<TourEntity>> FindAllAdmin(string? searchText, Domain.Enums.TourStatus? status, int pageNumber, int pageSize, Guid? managerId = null, TourScope? tourScope = null, Continent? continent = null, CancellationToken cancellationToken = default);
    Task<int> CountAllAdmin(string? searchText, Domain.Enums.TourStatus? status, Guid? managerId = null, TourScope? tourScope = null, Continent? continent = null, CancellationToken cancellationToken = default);
    Task Create(TourEntity tour, CancellationToken cancellationToken = default);
    Task Update(TourEntity tour, CancellationToken cancellationToken = default);
    Task<int> UpdateStatus(Guid id, TourStatus status, string userId, CancellationToken cancellationToken = default);
    Task SoftDelete(Guid id, CancellationToken cancellationToken = default);
    Task<List<TourEntity>> FindFeaturedTours(int limit, CancellationToken cancellationToken = default);
    Task<List<TourEntity>> FindLatestTours(int limit, CancellationToken cancellationToken = default);
    Task<List<TourEntity>> SearchTours(
        string? q,
        string? destination,
        string? classification,
        DateOnly? date,
        int? people,
        decimal? minPrice,
        decimal? maxPrice,
        int? minDays,
        int? maxDays,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<int> CountSearchTours(
        string? q,
        string? destination,
        string? classification,
        DateOnly? date,
        int? people,
        decimal? minPrice,
        decimal? maxPrice,
        int? minDays,
        int? maxDays,
        CancellationToken cancellationToken = default);
    Task<List<(string City, string Country, int ToursCount)>> GetTrendingDestinations(int limit, CancellationToken cancellationToken = default);
    Task<List<TourPlanLocationEntity>> GetTopAttractions(int limit, CancellationToken cancellationToken = default);
    Task<int> GetTotalActiveTours(CancellationToken cancellationToken = default);
    Task<decimal> GetTotalDistanceKm(CancellationToken cancellationToken = default);
    Task<List<string>> GetAllDestinations(CancellationToken cancellationToken = default);
    Task<TourPlanLocationEntity?> FindLocationByIdAsync(Guid id, CancellationToken cancellationToken = default);
}
