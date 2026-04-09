using Domain.Common.Repositories;
using Domain.Entities;
using ErrorOr;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories;

public class PositionRepository(AppDbContext context) : IPositionRepository
{
    private readonly AppDbContext _context = context;

    public async Task<ErrorOr<Success>> Upsert(PositionEntity position, CancellationToken ct = default)
    {
        var existing = await _context.Positions.FirstOrDefaultAsync(p => p.Id == position.Id, ct);
        if (existing is null)
        {
            await _context.Positions.AddAsync(position, ct);
        }
        else
        {
            existing.Name = position.Name;
            existing.Level = position.Level;
            existing.Note = position.Note;
            existing.Type = position.Type;
            existing.LastModifiedOnUtc = DateTimeOffset.UtcNow;
        }
        await _context.SaveChangesAsync(ct);
        return Result.Success;
    }

    public async Task<ErrorOr<List<PositionEntity>>> FindAll(CancellationToken ct = default)
    {
        return await _context.Positions
            .AsNoTracking()
            .Where(p => !p.IsDeleted)
            .OrderByDescending(p => p.CreatedOnUtc)
            .ToListAsync(ct);
    }

    public async Task<ErrorOr<PositionEntity?>> FindById(Guid id, CancellationToken ct = default)
    {
        var position = await _context.Positions
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, ct);
        return position;
    }
}