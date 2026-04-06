using Domain.Common.Repositories;
using Domain.Entities;
using ErrorOr;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SiteContentRepository(AppDbContext context) : Repository<SiteContentEntity>(context), ISiteContentRepository
{
    public async Task<List<SiteContentEntity>> GetByPageKeyAsync(string pageKey)
    {
        return await _context.SiteContents
            .AsNoTracking()
            .Where(sc => sc.PageKey == pageKey)
            .ToListAsync();
    }

    public async Task<SiteContentEntity?> GetByPageAndContentKeyAsync(string pageKey, string contentKey)
    {
        return await _context.SiteContents
            .AsNoTracking()
            .FirstOrDefaultAsync(sc => sc.PageKey == pageKey && sc.ContentKey == contentKey);
    }

    public async Task<List<SiteContentEntity>> GetAdminListAsync(string? pageKey, string? search)
    {
        var query = _context.SiteContents.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(pageKey))
        {
            var normalizedPageKey = pageKey.Trim().ToLowerInvariant();
            query = query.Where(sc => sc.PageKey.ToLower() == normalizedPageKey);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalizedSearch = search.Trim().ToLowerInvariant();
            query = query.Where(sc =>
                sc.PageKey.ToLower().Contains(normalizedSearch) ||
                sc.ContentKey.ToLower().Contains(normalizedSearch));
        }

        return await query
            .OrderBy(sc => sc.PageKey)
            .ThenBy(sc => sc.ContentKey)
            .ToListAsync();
    }

    public async Task<ErrorOr<SiteContentEntity>> UpsertAsync(string pageKey, string contentKey, string contentValue, string modifiedBy)
    {
        var existing = await _context.SiteContents
            .FirstOrDefaultAsync(sc => sc.PageKey == pageKey && sc.ContentKey == contentKey);

        if (existing != null)
        {
            existing.Update(contentValue, modifiedBy);
            _context.SiteContents.Update(existing);
            await _context.SaveChangesAsync();
            return existing;
        }

        var newEntity = SiteContentEntity.Create(pageKey, contentKey, contentValue, modifiedBy);
        await _context.SiteContents.AddAsync(newEntity);
        await _context.SaveChangesAsync();
        return newEntity;
    }

    public async Task<ErrorOr<SiteContentEntity>> UpsertByIdAsync(Guid id, string contentValue, string modifiedBy)
    {
        var existing = await _context.SiteContents
            .FirstOrDefaultAsync(sc => sc.Id == id);

        if (existing is null)
        {
            return Error.NotFound("SiteContent.NotFound", "Content not found");
        }

        existing.Update(contentValue, modifiedBy);
        _context.SiteContents.Update(existing);
        await _context.SaveChangesAsync();
        return existing;
    }
}
