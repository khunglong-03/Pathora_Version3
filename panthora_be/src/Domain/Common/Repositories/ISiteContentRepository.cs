using Domain.Entities;
using ErrorOr;

namespace Domain.Common.Repositories;

public interface ISiteContentRepository : IRepository<SiteContentEntity>
{
    Task<List<SiteContentEntity>> GetByPageKeyAsync(string pageKey, CancellationToken ct = default);
    Task<SiteContentEntity?> GetByPageAndContentKeyAsync(string pageKey, string contentKey, CancellationToken ct = default);
    Task<List<SiteContentEntity>> GetAdminListAsync(string? pageKey, string? search, CancellationToken ct = default);
    Task<ErrorOr<SiteContentEntity>> UpsertAsync(string pageKey, string contentKey, string contentValue, string modifiedBy, CancellationToken ct = default);
    Task<ErrorOr<SiteContentEntity>> UpsertByIdAsync(Guid id, string contentValue, string modifiedBy, CancellationToken ct = default);
}