using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class CancellationPolicyRepository(AppDbContext context) : ICancellationPolicyRepository
{
    private readonly AppDbContext _context = context;

    public async Task<CancellationPolicyEntity?> FindById(Guid id)
    {
        return await _context.CancellationPolicies
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
    }

    public async Task<IReadOnlyList<CancellationPolicyEntity>> FindAll()
    {
        var entities = await _context.CancellationPolicies
            .AsNoTracking()
            .Where(p => !p.IsDeleted)
            .ToListAsync();

        return entities
            .OrderBy(p => p.TourScope)
            .ThenBy(p => p.Tiers.Count > 0 ? p.Tiers.Min(t => t.MinDaysBeforeDeparture) : 0)
            .ToList();
    }

    public async Task<CancellationPolicyEntity?> FindByTourScopeAndDays(TourScope tourScope, int daysBeforeDeparture)
    {
        return await _context.CancellationPolicies
            .AsNoTracking()
            .Where(p => p.TourScope == tourScope
                    && !p.IsDeleted
                    && p.Status == CancellationPolicyStatus.Active)
            .ToListAsync()
            .ContinueWith(task =>
                task.Result
                    .Select(p => new { Policy = p, Tier = p.FindMatchingTier(daysBeforeDeparture) })
                    .Where(x => x.Tier != null)
                    .OrderByDescending(x => x.Tier!.MinDaysBeforeDeparture)
                    .Select(x => x.Policy)
                    .FirstOrDefault());
    }

    public async Task<IReadOnlyList<CancellationPolicyEntity>> FindByTourScope(TourScope tourScope)
    {
        return await _context.CancellationPolicies
            .AsNoTracking()
            .Where(p => p.TourScope == tourScope && !p.IsDeleted)
            .ToListAsync();
    }

    public async Task Create(CancellationPolicyEntity entity)
    {
        await _context.CancellationPolicies.AddAsync(entity);
    }

    public async Task UpdateAsync(CancellationPolicyEntity entity)
    {
        _context.CancellationPolicies.Update(entity);
        await Task.CompletedTask;
    }
}
