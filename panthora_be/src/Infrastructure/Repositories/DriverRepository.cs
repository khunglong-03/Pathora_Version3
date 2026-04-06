using Domain.Common.Repositories;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Repositories.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class DriverRepository(AppDbContext context) : Repository<DriverEntity>(context), IDriverRepository
{
    public async Task<List<DriverEntity>> FindAllByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Drivers
            .AsNoTracking()
            .Where(d => d.UserId == userId)
            .OrderBy(d => d.FullName)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<DriverEntity>> FindActiveByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Drivers
            .AsNoTracking()
            .Where(d => d.UserId == userId && d.IsActive)
            .OrderBy(d => d.FullName)
            .ToListAsync(cancellationToken);
    }

    public async Task<DriverEntity?> FindByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Drivers
            .AsNoTracking()
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
    }

    public async Task<DriverEntity?> FindByIdAndUserIdAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Drivers
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId, cancellationToken);
    }

    public async Task<bool> ExistsByLicenseNumberAsync(string licenseNumber, CancellationToken cancellationToken = default)
    {
        return await _context.Drivers
            .AnyAsync(d => d.LicenseNumber == licenseNumber.Trim().ToUpperInvariant(), cancellationToken);
    }

    public async Task<bool> ExistsByLicenseNumberAndUserIdAsync(string licenseNumber, Guid userId, CancellationToken cancellationToken = default)
    {
        return await _context.Drivers
            .AnyAsync(d => d.LicenseNumber == licenseNumber.Trim().ToUpperInvariant() && d.UserId == userId, cancellationToken);
    }

    public async Task CreateAsync(DriverEntity driver, CancellationToken cancellationToken = default)
    {
        await _context.Drivers.AddAsync(driver, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(DriverEntity driver, CancellationToken cancellationToken = default)
    {
        _context.Drivers.Update(driver);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeactivateAsync(Guid id, string performedBy, CancellationToken cancellationToken = default)
    {
        var driver = await _context.Drivers.FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
        if (driver != null)
        {
            driver.Deactivate(performedBy);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<List<DriverEntity>> FindByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default)
    {
        return await _context.Drivers
            .AsNoTracking()
            .Where(d => d.UserId == ownerId)
            .OrderBy(d => d.FullName)
            .ToListAsync(cancellationToken);
    }
}
