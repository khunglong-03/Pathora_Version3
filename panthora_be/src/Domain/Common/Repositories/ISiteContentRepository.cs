using Domain.Entities;
using ErrorOr;

namespace Domain.Common.Repositories;

public interface ISiteContentRepository : IRepository<SiteContentEntity>
{
    Task<List<SiteContentEntity>> GetByPageKeyAsync(string pageKey);
    Task<SiteContentEntity?> GetByPageAndContentKeyAsync(string pageKey, string contentKey);
    Task<List<SiteContentEntity>> GetAdminListAsync(string? pageKey, string? search);
    Task<ErrorOr<SiteContentEntity>> UpsertAsync(string pageKey, string contentKey, string contentValue, string modifiedBy);
    Task<ErrorOr<SiteContentEntity>> UpsertByIdAsync(Guid id, string contentValue, string modifiedBy);
}
