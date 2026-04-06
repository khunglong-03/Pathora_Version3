using Domain.Common.Repositories;
using Domain.Constant;
using ErrorOr;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class SystemKeyRepository(AppDbContext context) : ISystemKeyRepository
{
    private readonly AppDbContext _context = context;

    public async Task<ErrorOr<List<SystemKey>>> FindAll()
    {
        return await _context.SystemKeys
            .AsNoTracking()
            .Where(s => !s.IsDeleted)
            .OrderBy(s => s.SortOrder)
            .ToListAsync();
    }

    public async Task<SystemKey?> FindByCode(string codeKey)
    {
        return await _context.SystemKeys
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.CodeKey == codeKey && !s.IsDeleted);
    }
}
