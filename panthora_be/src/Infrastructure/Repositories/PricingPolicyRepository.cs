using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class PricingPolicyRepository(AppDbContext context) : IPricingPolicyRepository
{
    private readonly AppDbContext _context = context;

    public async Task<PricingPolicy?> FindById(Guid id, bool asNoTracking = false)
    {
        var query = asNoTracking
            ? _context.PricingPolicies.AsNoTracking()
            : _context.PricingPolicies;

        return await query.FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<PricingPolicy?> FindByPolicyCode(string policyCode, Guid? excludeId = null)
    {
        var query = _context.PricingPolicies.Where(p => p.PolicyCode == policyCode);
        if (excludeId.HasValue)
            query = query.Where(p => p.Id != excludeId.Value);
        return await query.FirstOrDefaultAsync();
    }

    public async Task<List<PricingPolicy>> FindAll(bool includeDeleted = false)
    {
        var query = _context.PricingPolicies.AsNoTracking();
        if (!includeDeleted)
            query = query.Where(p => !p.IsDeleted);
        return await query.OrderByDescending(p => p.CreatedOnUtc).ToListAsync();
    }

    public async Task<PricingPolicy?> GetDefaultPolicy()
    {
        return await _context.PricingPolicies
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IsDefault && !p.IsDeleted);
    }

    public async Task<PricingPolicy?> GetActivePolicyByTourType(TourType tourType)
    {
        return await _context.PricingPolicies
            .AsNoTracking()
            .FirstOrDefaultAsync(p =>
                p.Status == PricingPolicyStatus.Active &&
                p.TourType == tourType &&
                !p.IsDeleted);
    }

    public async Task Create(PricingPolicy policy)
    {
        await _context.PricingPolicies.AddAsync(policy);
    }

    public async Task UpdateAsync(PricingPolicy policy)
    {
        _context.PricingPolicies.Update(policy);
    }

    public async Task SoftDelete(Guid id)
    {
        var policy = await _context.PricingPolicies.FirstOrDefaultAsync(p => p.Id == id);
        if (policy != null)
        {
            policy.IsDeleted = true;
        }
    }

    public async Task SetAsDefault(Guid id)
    {
        var policy = await _context.PricingPolicies.FirstOrDefaultAsync(p => p.Id == id);
        if (policy != null)
        {
            policy.IsDefault = true;
        }
    }

    public async Task RemoveDefaultFromOthers(Guid excludeId)
    {
        var policies = await _context.PricingPolicies
            .Where(p => p.IsDefault && p.Id != excludeId)
            .ToListAsync();
        foreach (var policy in policies)
        {
            policy.IsDefault = false;
        }
    }
}
