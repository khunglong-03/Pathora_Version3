using Domain.Entities;

namespace Domain.Common.Repositories;

public interface ITourRepository
{
    Task<TourEntity?> FindById(Guid id, bool asNoTracking = false);
    Task<TourEntity?> FindByIdForUpdate(Guid id);
    Task<bool> ExistsByTourCode(string tourCode, Guid? excludeId = null);
    Task<List<TourEntity>> FindAll(string? searchText, int pageNumber, int pageSize);
    Task<int> CountAll(string? searchText);
    Task<List<TourEntity>> FindAllAdmin(string? searchText, Domain.Enums.TourStatus? status, int pageNumber, int pageSize);
    Task<int> CountAllAdmin(string? searchText, Domain.Enums.TourStatus? status);
    Task Create(TourEntity tour);
    Task Update(TourEntity tour);
    Task<int> UpdateStatus(Guid id, TourStatus status, string userId);
    Task SoftDelete(Guid id);
    Task<List<TourEntity>> FindFeaturedTours(int limit);
    Task<List<TourEntity>> FindLatestTours(int limit);
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
        int pageSize);
    Task<int> CountSearchTours(
        string? q,
        string? destination,
        string? classification,
        DateOnly? date,
        int? people,
        decimal? minPrice,
        decimal? maxPrice,
        int? minDays,
        int? maxDays);
    Task<List<(string City, string Country, int ToursCount)>> GetTrendingDestinations(int limit);
    Task<List<TourPlanLocationEntity>> GetTopAttractions(int limit);
    Task<int> GetTotalActiveTours(CancellationToken cancellationToken = default);
    Task<decimal> GetTotalDistanceKm(CancellationToken cancellationToken = default);
    Task<List<string>> GetAllDestinations();
    Task<TourPlanLocationEntity?> FindLocationByIdAsync(Guid id);
}
