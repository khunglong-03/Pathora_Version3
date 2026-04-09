using Domain.Common.Repositories;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class PricingPolicyRepository(AppDbContext context) : IPricingPolicyRepository
{
    private readonly AppDbContext _context = context;

    public async Task<PricingPolicy?> FindById(Guid id, bool asNoTracking = false, CancellationToken cancellationToken = default)
    {
        var query = asNoTracking
            ? _context.PricingPolicies.AsNoTracking()
            : _context.PricingPolicies;

        return await query.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<PricingPolicy?> FindByPolicyCode(string policyCode, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.PricingPolicies.Where(p => p.PolicyCode == policyCode);
        if (excludeId.HasValue)
            query = query.Where(p => p.Id != excludeId.Value);
        return await query.FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<PricingPolicy>> FindAll(bool includeDeleted = false, CancellationToken cancellationToken = default)
    {
        var query = _context.PricingPolicies.AsNoTracking();
        if (!includeDeleted)
            query = query.Where(p => !p.IsDeleted);
        return await query.OrderByDescending(p => p.CreatedOnUtc).ToListAsync(cancellationToken);
    }

    public async Task<PricingPolicy?> GetDefaultPolicy(CancellationToken cancellationToken = default)
    {
        return await _context.PricingPolicies
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.IsDefault && !p.IsDeleted, cancellationToken);
    }

    public async Task<PricingPolicy?> GetActivePolicyByTourType(TourType tourType, CancellationToken cancellationToken = default)
    {
        return await _context.PricingPolicies
            .AsNoTracking()
            .FirstOrDefaultAsync(p =>
                p.Status == PricingPolicyStatus.Active &&
                p.TourType == tourType &&
                !p.IsDeleted,
                cancellationToken);
    }

    public async Task Create(PricingPolicy policy, CancellationToken cancellationToken = default)
    {
        await _context.PricingPolicies.AddAsync(policy, cancellationToken);
    }

    public async Task UpdateAsync(PricingPolicy policy, CancellationToken cancellationToken = default)
    {
        _context.PricingPolicies.Update(policy);
        await Task.CompletedTask;
    }

    public async Task SoftDelete(Guid id, CancellationToken cancellationToken = default)
    {
        var policy = await _context.PricingPolicies.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (policy != null)
        {
            policy.IsDeleted = true;
        }
    }

    public async Task SetAsDefault(Guid id, CancellationToken cancellationToken = default)
    {
        var policy = await _context.PricingPolicies.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (policy != null)
        {
            policy.IsDefault = true;
        }
    }

    public async Task RemoveDefaultFromOthers(Guid excludeId, CancellationToken cancellationToken = default)
    {
        var policies = await _context.PricingPolicies
            .Where(p => p.IsDefault && p.Id != excludeId)
            .ToListAsync(cancellationToken);
        foreach (var policy in policies)
        {
            policy.IsDefault = false;
        }
    }
}